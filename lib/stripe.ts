import { supabase } from './supabase'

type Stripe = any
let loadStripe: ((key: string) => Promise<Stripe | null>) | null = null

const STRIPE_PUBLISHABLE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY

if (!STRIPE_PUBLISHABLE_KEY) {
  throw new Error('Missing Stripe publishable key. Please set VITE_STRIPE_PUBLISHABLE_KEY in your environment variables.')
}

let stripePromise: Promise<Stripe | null>

export const getStripe = async (): Promise<Stripe | null> => {
  if (!loadStripe) {
    try {
      const stripeModule = await import('@stripe/stripe-js')
      loadStripe = stripeModule.loadStripe
    } catch {
      console.warn('@stripe/stripe-js is not installed. Please install it: npm install @stripe/stripe-js')
      return null
    }
  }
  
  if (!stripePromise && loadStripe) {
    stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY)
  }
  return stripePromise || Promise.resolve(null)
}

export const stripeConfig = {
  publishableKey: STRIPE_PUBLISHABLE_KEY,
  currency: 'usd',
  features: ["checkout", "subscriptions"],
  collectBillingAddress: true,
  collectShippingAddress: false,
  allowPromotionCodes: true,
} as const

export interface CreateCheckoutSessionParams {
  amount: number
  currency?: string
  description?: string
  metadata?: Record<string, string>
  successUrl?: string
  cancelUrl?: string
  customerEmail?: string
  allowPromotionCodes?: boolean
  collectBillingAddress?: boolean
  collectShippingAddress?: boolean
}

export const createCheckoutSession = async (params: CreateCheckoutSessionParams) => {
  const {
    amount,
    currency = stripeConfig.currency,
    description = 'Payment',
    metadata = {},
    successUrl = `${window.location.origin}/payment/success`,
    cancelUrl = `${window.location.origin}/payment/cancel`,
    customerEmail,
    allowPromotionCodes = stripeConfig.allowPromotionCodes,
    collectBillingAddress = stripeConfig.collectBillingAddress,
    collectShippingAddress = stripeConfig.collectShippingAddress,
  } = params

  const { data, error } = await supabase.functions.invoke('create-checkout-session', {
    body: {
      amount,
      currency,
      description,
      metadata,
      successUrl,
      cancelUrl,
      customerEmail,
      allowPromotionCodes,
      collectBillingAddress,
      collectShippingAddress,
    },
  })

  if (error) {
    throw new Error(error.message)
  }

  return data
}
export interface CreateSubscriptionParams {
  planId: string
  trialDays?: number
  successUrl?: string
  cancelUrl?: string
  customerEmail?: string
  allowPromotionCodes?: boolean
  collectBillingAddress?: boolean
  promoCode?: string
}

export const createSubscription = async (params: CreateSubscriptionParams) => {
  const {
    planId,
    trialDays = 0,
    successUrl = `${window.location.origin}/success?type=subscription`,
    cancelUrl = `${window.location.origin}/cancel`,
    customerEmail,
    allowPromotionCodes,
    collectBillingAddress,
    promoCode,
  } = params

  const { data, error } = await supabase.functions.invoke('create-subscription', {
    body: {
      priceId: planId,
      trialDays,
      successUrl,
      cancelUrl,
      customerEmail,
      allowPromotionCodes,
      collectBillingAddress,
      promoCode,
    },
  })

  if (error) {
    throw new Error(error.message)
  }

  return data
}

export interface ValidatePromoCodeParams {
  code: string
}

export const validatePromoCode = async (params: ValidatePromoCodeParams) => {
  const response = await fetch('/api/validate-promo-code', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  })

  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.error || 'Failed to validate promo code')
  }

  return response.json()
}
export const getPaymentSession = async (sessionId: string) => {
  const response = await fetch(`/api/payment-session/${sessionId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.error || 'Failed to get payment session')
  }

  return response.json()
}

export interface CreateCustomerPortalParams {
  customerId: string
  returnUrl?: string
}

export const createCustomerPortal = async (params: CreateCustomerPortalParams) => {
  const {
    customerId,
  } = params

  console.log('Creating customer portal for:', customerId)
  
  await new Promise(resolve => setTimeout(resolve, 500))
  
  const mockPortalUrl = `https://billing.stripe.com/session/mock_${Math.random().toString(36).substring(7)}`
  console.log('Mock portal URL generated:', mockPortalUrl)
  
  return { url: mockPortalUrl }
}

export interface CancelSubscriptionParams {
  subscriptionId: string
  cancelAtPeriodEnd?: boolean
}

export const cancelSubscription = async (params: CancelSubscriptionParams) => {
  const {
    subscriptionId,
    cancelAtPeriodEnd = true,
  } = params

  const response = await fetch('/api/cancel-subscription', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      subscription_id: subscriptionId,
      cancel_at_period_end: cancelAtPeriodEnd,
    }),
  })

  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.error || 'Failed to cancel subscription')
  }

  return response.json()
}
export const getAvailablePlans = async () => {
  const response = await fetch('/api/subscription-plans', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.error || 'Failed to get subscription plans')
  }

  return response.json()
}

export const getCurrentSubscription = async (userId: string) => {
  const response = await fetch(`/api/subscription/${userId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.error || 'Failed to get current subscription')
  }

  return response.json()
}

export interface UpdateSubscriptionParams {
  subscriptionId: string
  newPlanId: string
  prorationBehavior?: 'create_prorations' | 'none' | 'always_invoice'
}

export const updateSubscription = async (params: UpdateSubscriptionParams) => {
  const response = await fetch('/api/update-subscription', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  })

  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.error || 'Failed to update subscription')
  }

  return response.json()
}

export const reactivateSubscription = async (subscriptionId: string) => {
  const response = await fetch('/api/reactivate-subscription', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      subscription_id: subscriptionId,
    }),
  })

  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.error || 'Failed to reactivate subscription')
  }

  return response.json()
}
export const getSubscriptionInvoices = async (customerId: string, limit: number = 10) => {
  const response = await fetch(`/api/invoices/${customerId}?limit=${limit}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.error || 'Failed to get invoices')
  }

  return response.json()
}

export const redirectToCheckout = async (sessionId: string) => {
  const stripe = await getStripe()
  
  if (!stripe) {
    throw new Error('Failed to load Stripe')
  }

  const { error } = await stripe.redirectToCheckout({ sessionId })
  
  if (error) {
    throw new Error(error.message)
  }
}

export const formatAmount = (amount: number, currency: string = stripeConfig.currency) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(amount / 100)
}

export const validateAmount = (amount: number, currency: string = stripeConfig.currency) => {
  if (amount <= 0) {
    throw new Error('Amount must be greater than zero')
  }

  const minimums: Record<string, number> = {
    usd: 50,
    eur: 50,
    gbp: 30,
    cad: 50,
    aud: 50,
  }

  const minimum = minimums[currency.toLowerCase()] || 50
  
  if (amount < minimum) {
    throw new Error(`Amount must be at least ${formatAmount(minimum, currency)}`)
  }

  const maximum = 99999999
  
  if (amount > maximum) {
    throw new Error(`Amount cannot exceed ${formatAmount(maximum, currency)}`)
  }

  return true
}
export const handleStripeError = (error: any): string => {
  if (error?.type === 'card_error') {
    return error.message || 'Your card was declined'
  }
  
  if (error?.type === 'validation_error') {
    return error.message || 'Invalid payment information'
  }
  
  if (error?.type === 'api_error') {
    return 'Payment processing error. Please try again.'
  }
  
  if (error?.type === 'authentication_error') {
    return 'Authentication error. Please contact support.'
  }
  
  if (error?.type === 'rate_limit_error') {
    return 'Too many requests. Please try again in a moment.'
  }
  
  return error?.message || 'An unexpected error occurred'
}

export interface AnalyticsRequest {
  type: 'promo_usage' | 'payment_summary' | 'subscription_metrics' | 'customer_analytics'
  startDate?: string
  endDate?: string
  promoCode?: string
  limit?: number
}

export interface PromoUsageAnalytics {
  promoCode: string
  totalRedemptions: number
  totalDiscountAmount: number
  currency: string
  averageOrderValue: number
  conversionRate: number
  revenueImpact: number
  topCustomers: Array<{
    customerId: string
    email?: string
    redemptions: number
    totalSpent: number
  }>
}

export interface PaymentSummaryAnalytics {
  totalRevenue: number
  totalTransactions: number
  averageTransactionValue: number
  currency: string
  successRate: number
  refundRate: number
  topPaymentMethods: Array<{
    type: string
    count: number
    percentage: number
  }>
}

export interface SubscriptionMetrics {
  activeSubscriptions: number
  newSubscriptions: number
  canceledSubscriptions: number
  churnRate: number
  monthlyRecurringRevenue: number
  averageRevenuePerUser: number
  lifetimeValue: number
}

export interface CustomerAnalytics {
  totalCustomers: number
  newCustomers: number
  returningCustomers: number
  topCustomers: Array<{
    customerId: string
    email?: string
    totalSpent: number
    orderCount: number
    lifetimeValue: number
  }>
}

export interface AnalyticsResponse {
  type: string
  dateRange: {
    start: string
    end: string
  }
  data: PromoUsageAnalytics | PaymentSummaryAnalytics | SubscriptionMetrics | CustomerAnalytics
}
export const getPromoUsageAnalytics = async (params: {
  startDate?: string
  endDate?: string
  promoCode?: string
  limit?: number
}): Promise<AnalyticsResponse> => {
  const response = await fetch('/api/payment-analytics', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      type: 'promo_usage',
      ...params,
    }),
  })

  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.error || 'Failed to get promo usage analytics')
  }

  return response.json()
}

export const getPaymentSummaryAnalytics = async (params: {
  startDate?: string
  endDate?: string
}): Promise<AnalyticsResponse> => {
  const response = await fetch('/api/payment-analytics', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      type: 'payment_summary',
      ...params,
    }),
  })

  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.error || 'Failed to get payment summary analytics')
  }

  return response.json()
}

export const getSubscriptionMetrics = async (params: {
  startDate?: string
  endDate?: string
}): Promise<AnalyticsResponse> => {
  const response = await fetch('/api/payment-analytics', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      type: 'subscription_metrics',
      ...params,
    }),
  })

  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.error || 'Failed to get subscription metrics')
  }

  return response.json()
}
export const getCustomerAnalytics = async (params: {
  startDate?: string
  endDate?: string
  limit?: number
}): Promise<AnalyticsResponse> => {
  const response = await fetch('/api/payment-analytics', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      type: 'customer_analytics',
      ...params,
    }),
  })

  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.error || 'Failed to get customer analytics')
  }

  return response.json()
}

export const trackPromoCodeUsage = async (params: {
  promoCode: string
  customerId?: string
  orderValue: number
  discountAmount: number
  currency?: string
}): Promise<void> => {
  try {
    await fetch('/api/track-promo-usage', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        promo_code: params.promoCode,
        customer_id: params.customerId,
        order_value: params.orderValue,
        discount_amount: params.discountAmount,
        currency: params.currency || 'usd',
        timestamp: new Date().toISOString(),
      }),
    })
  } catch (error) {
    console.warn('Failed to track promo code usage:', error)
  }
}

