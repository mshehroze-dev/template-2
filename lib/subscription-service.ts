import { supabase } from './supabase'
import type {
  SubscriptionPlan,
  UserSubscription,
  CreateSubscriptionParams,
  UpdateSubscriptionParams,
  SubscriptionChangeRequest,
  SubscriptionChangeResponse,
  SubscriptionService as ISubscriptionService,
} from './payment-types'
import {
  isActiveSubscription,
  canCancelSubscription,
  canReactivateSubscription,
  validatePlanChange,
  getChangeType,
  SUBSCRIPTION_ERROR_MESSAGES,
} from './subscription-validation'
import {
  createSubscription as createStripeSubscription,
  updateSubscription as updateStripeSubscription,
  cancelSubscription as cancelStripeSubscription,
  reactivateSubscription as reactivateStripeSubscription,
  createCustomerPortal,
  getAvailablePlans as getStripePlans,
} from './stripe'

export class SubscriptionService implements ISubscriptionService {
  async getAvailablePlans(): Promise<SubscriptionPlan[]> {
    try {
      const { data: cachedPlans, error: cacheError } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('active', true)
        .order('tier', { ascending: true })

      if (!cacheError && cachedPlans && cachedPlans.length > 0) {
        return cachedPlans.map(this.mapDatabasePlanToSubscriptionPlan)
      }

      if (cacheError && (cacheError.code === 'PGRST106' || cacheError.message.includes('relation "subscription_plans" does not exist'))) {
        console.warn('subscription_plans table does not exist, using Stripe API fallback')
      }

      const stripePlans = await getStripePlans()
      return stripePlans.data || []
    } catch (error) {
      console.error('Error fetching subscription plans:', error)
      throw new Error('Failed to fetch subscription plans')
    }
  }

  async getCurrentSubscription(userId: string): Promise<UserSubscription | null> {
    try {
      const { data: subscription, error } = await supabase
        .from('subscriptions')
        .select(`
          *,
          subscription_plans (*)
        `)
        .eq('user_id', userId)
        .eq('status', 'active')
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          return null
        }
        throw error
      }

      return this.mapDatabaseSubscriptionToUserSubscription(subscription)
    } catch (error) {
      console.error('Error fetching current subscription:', error)
      throw new Error('Failed to fetch current subscription')
    }
  }

  async createSubscription(params: CreateSubscriptionParams): Promise<UserSubscription> {
    try {
      const { planId, userId, customerId, trialPeriodDays, promoCode, metadata } = params

      const plans = await this.getAvailablePlans()
      const plan = plans.find(p => p.id === planId)
      if (!plan) {
        throw new Error(SUBSCRIPTION_ERROR_MESSAGES.PLAN_NOT_FOUND)
      }

      const existingSubscription = await this.getCurrentSubscription(userId)
      if (existingSubscription && isActiveSubscription(existingSubscription)) {
        throw new Error('User already has an active subscription')
      }

      const stripeResponse = await createStripeSubscription({
        planId: plan.stripePriceId,
        trialDays: trialPeriodDays,
        customerEmail: customerId,
        promoCode,
      })

      const { data: newSubscription, error } = await supabase
        .from('subscriptions')
        .insert({
          user_id: userId,
          stripe_subscription_id: stripeResponse.subscriptionId,
          stripe_customer_id: customerId,
          plan_id: planId,
          status: 'active',
          current_period_start: new Date().toISOString(),
          current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          cancel_at_period_end: false,
          trial_start: trialPeriodDays ? new Date().toISOString() : null,
          trial_end: trialPeriodDays ? new Date(Date.now() + trialPeriodDays * 24 * 60 * 60 * 1000).toISOString() : null,
          metadata: metadata || {},
        })
        .select()
        .single()

      if (error) {
        throw error
      }

      return this.mapDatabaseSubscriptionToUserSubscription({ ...newSubscription, plan })
    } catch (error) {
      console.error('Error creating subscription:', error)
      throw new Error('Failed to create subscription')
    }
  }

  async updateSubscription(subscriptionId: string, params: UpdateSubscriptionParams): Promise<UserSubscription> {
    try {
      const { planId, cancelAtPeriodEnd, metadata } = params

      const { data: currentSub, error: fetchError } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('id', subscriptionId)
        .single()

      if (fetchError || !currentSub) {
        throw new Error(SUBSCRIPTION_ERROR_MESSAGES.SUBSCRIPTION_NOT_FOUND)
      }

      const currentSubscription = this.mapDatabaseSubscriptionToUserSubscription(currentSub)

      if (planId && planId !== currentSubscription.planId) {
        const plans = await this.getAvailablePlans()
        const newPlan = plans.find(p => p.id === planId)
        if (!newPlan) {
          throw new Error(SUBSCRIPTION_ERROR_MESSAGES.PLAN_NOT_FOUND)
        }

        const validation = validatePlanChange(currentSubscription, newPlan)
        if (!validation.valid) {
          throw new Error(validation.error)
        }

        await updateStripeSubscription({
          subscriptionId: currentSubscription.stripeSubscriptionId,
          newPlanId: newPlan.stripePriceId,
          prorationBehavior: 'create_prorations',
        })
      }

      const updateData: any = {}
      if (planId) updateData.plan_id = planId
      if (cancelAtPeriodEnd !== undefined) updateData.cancel_at_period_end = cancelAtPeriodEnd
      if (metadata) updateData.metadata = { ...currentSub.metadata, ...metadata }

      const { data: updatedSubscription, error: updateError } = await supabase
        .from('subscriptions')
        .update(updateData)
        .eq('id', subscriptionId)
        .select()
        .single()

      if (updateError) {
        throw updateError
      }

      return this.mapDatabaseSubscriptionToUserSubscription(updatedSubscription)
    } catch (error) {
      console.error('Error updating subscription:', error)
      throw new Error('Failed to update subscription')
    }
  }

  async cancelSubscription(subscriptionId: string, cancelAtPeriodEnd: boolean = true): Promise<void> {
    try {
      const { data: currentSub, error: fetchError } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('id', subscriptionId)
        .single()

      if (fetchError || !currentSub) {
        throw new Error(SUBSCRIPTION_ERROR_MESSAGES.SUBSCRIPTION_NOT_FOUND)
      }

      const subscription = this.mapDatabaseSubscriptionToUserSubscription(currentSub)

      if (!canCancelSubscription(subscription)) {
        throw new Error(SUBSCRIPTION_ERROR_MESSAGES.SUBSCRIPTION_ALREADY_CANCELED)
      }

      await cancelStripeSubscription({
        subscriptionId: subscription.stripeSubscriptionId,
        cancelAtPeriodEnd,
      })

      const updateData: any = {
        cancel_at_period_end: cancelAtPeriodEnd,
      }

      if (!cancelAtPeriodEnd) {
        updateData.status = 'canceled'
        updateData.canceled_at = new Date().toISOString()
      }

      const { error: updateError } = await supabase
        .from('subscriptions')
        .update(updateData)
        .eq('id', subscriptionId)

      if (updateError) {
        throw updateError
      }
    } catch (error) {
      console.error('Error canceling subscription:', error)
      throw new Error('Failed to cancel subscription')
    }
  }

  async reactivateSubscription(subscriptionId: string): Promise<UserSubscription> {
    try {
      const { data: currentSub, error: fetchError } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('id', subscriptionId)
        .single()

      if (fetchError || !currentSub) {
        throw new Error(SUBSCRIPTION_ERROR_MESSAGES.SUBSCRIPTION_NOT_FOUND)
      }

      const subscription = this.mapDatabaseSubscriptionToUserSubscription(currentSub)

      if (!canReactivateSubscription(subscription)) {
        throw new Error('Cannot reactivate this subscription')
      }

      await reactivateStripeSubscription(subscription.stripeSubscriptionId)

      const { data: updatedSubscription, error: updateError } = await supabase
        .from('subscriptions')
        .update({
          status: 'active',
          cancel_at_period_end: false,
          canceled_at: null,
        })
        .eq('id', subscriptionId)
        .select()
        .single()

      if (updateError) {
        throw updateError
      }

      return this.mapDatabaseSubscriptionToUserSubscription(updatedSubscription)
    } catch (error) {
      console.error('Error reactivating subscription:', error)
      throw new Error('Failed to reactivate subscription')
    }
  }

  async createCustomerPortalSession(customerId: string, returnUrl?: string): Promise<{ url: string }> {
    try {
      return await createCustomerPortal({
        customerId,
        returnUrl: returnUrl || window.location.href,
      })
    } catch (error) {
      console.error('Error creating customer portal session:', error)
      throw new Error('Failed to create customer portal session')
    }
  }

  async changeSubscriptionPlan(request: SubscriptionChangeRequest): Promise<SubscriptionChangeResponse> {
    try {
      const { subscriptionId, newPlanId, prorationBehavior = 'create_prorations' } = request

      const { data: currentSub, error: fetchError } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('id', subscriptionId)
        .single()

      if (fetchError || !currentSub) {
        throw new Error(SUBSCRIPTION_ERROR_MESSAGES.SUBSCRIPTION_NOT_FOUND)
      }

      const currentSubscription = this.mapDatabaseSubscriptionToUserSubscription(currentSub)
      const plans = await this.getAvailablePlans()
      const currentPlan = plans.find(p => p.id === currentSubscription.planId)
      const newPlan = plans.find(p => p.id === newPlanId)

      if (!currentPlan || !newPlan) {
        throw new Error(SUBSCRIPTION_ERROR_MESSAGES.PLAN_NOT_FOUND)
      }

      const validation = validatePlanChange(currentSubscription, newPlan)
      if (!validation.valid) {
        throw new Error(validation.error)
      }

      const changeType = getChangeType(currentPlan, newPlan)

      await updateStripeSubscription({
        subscriptionId: currentSubscription.stripeSubscriptionId,
        newPlanId: newPlan.stripePriceId,
        prorationBehavior,
      })

      const { data: updatedSubscription, error: updateError } = await supabase
        .from('subscriptions')
        .update({
          plan_id: newPlanId,
        })
        .eq('id', subscriptionId)
        .select()
        .single()

      if (updateError) {
        throw updateError
      }

      const updatedUserSubscription = this.mapDatabaseSubscriptionToUserSubscription(updatedSubscription)

      return {
        subscription: updatedUserSubscription,
        prorationAmount: 0,
        effectiveDate: changeType === 'upgrade' ? new Date().toISOString() : currentSubscription.currentPeriodEnd.toISOString(),
        changeType,
      }
    } catch (error) {
      console.error('Error changing subscription plan:', error)
      throw new Error('Failed to change subscription plan')
    }
  }

  private mapDatabaseSubscriptionToUserSubscription(dbSub: any): UserSubscription {
    return {
      id: dbSub.id,
      userId: dbSub.user_id,
      stripeSubscriptionId: dbSub.stripe_subscription_id,
      stripeCustomerId: dbSub.stripe_customer_id,
      planId: dbSub.plan_id,
      status: dbSub.status,
      currentPeriodStart: new Date(dbSub.current_period_start),
      currentPeriodEnd: new Date(dbSub.current_period_end),
      cancelAtPeriodEnd: dbSub.cancel_at_period_end,
      canceledAt: dbSub.canceled_at ? new Date(dbSub.canceled_at) : undefined,
      trialStart: dbSub.trial_start ? new Date(dbSub.trial_start) : undefined,
      trialEnd: dbSub.trial_end ? new Date(dbSub.trial_end) : undefined,
      createdAt: new Date(dbSub.created_at),
      updatedAt: new Date(dbSub.updated_at),
      plan: dbSub.plan ? this.mapDatabasePlanToSubscriptionPlan(dbSub.plan) : undefined,
    }
  }

  private mapDatabasePlanToSubscriptionPlan(dbPlan: any): SubscriptionPlan {
    return {
      id: dbPlan.id,
      name: dbPlan.name,
      description: dbPlan.description,
      price: dbPlan.price,
      currency: dbPlan.currency,
      interval: dbPlan.interval,
      intervalCount: dbPlan.interval_count,
      trialPeriodDays: dbPlan.trial_period_days,
      features: dbPlan.features || [],
      popular: dbPlan.popular || false,
      stripePriceId: dbPlan.stripe_price_id,
      stripeProductId: dbPlan.stripe_product_id,
      metadata: dbPlan.metadata || {},
      active: dbPlan.active,
      tier: dbPlan.tier,
    }
  }
}

export const subscriptionService = new SubscriptionService()

