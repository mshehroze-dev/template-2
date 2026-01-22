import React from 'react'
import type { 
  SubscriptionPlansViewProps, 
  SubscriptionPlan 
} from '../../lib/payment-types'
import { 
  formatCurrency
} from '../../lib/payment-utils'
import { formatPlanInterval } from '../../lib/subscription-validation'
import CheckoutButton from './CheckoutButton'

const SubscriptionPlansView: React.FC<SubscriptionPlansViewProps> = ({ 
  plans, 
  currentPlan, 
  onPlanSelect, 
  loading = false 
}) => {
  const activePlans = plans.filter((plan: SubscriptionPlan) => plan.active)
  const [error, setError] = React.useState<string | null>(null)

  const safeOnPlanSelect = async (planId: string) => {
    if (!onPlanSelect) return
    try {
      setError(null)
      await onPlanSelect(planId)
    } catch (err) {
      console.error(err)
      setError('Failed to select plan. Please try again.')
    }
  }
  
  if (activePlans.length === 0) {
    return (
      <div className="text-center py-12">
        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-[#0E315D]">No Plans Available</h3>
        <p className="mt-1 text-sm text-gray-500">
          Subscription plans are currently being updated. Please check back later.
        </p>
      </div>
    )
  }

  const getPopularPlan = (): SubscriptionPlan | null => {
    if (activePlans.length >= 3) {
      const sortedByPrice = [...activePlans].sort((a, b) => a.price - b.price)
      return sortedByPrice[Math.floor(sortedByPrice.length / 2)]
    }
    return null
  }

  const popularPlan = getPopularPlan()

  const getPlanFeatures = (plan: SubscriptionPlan): string[] => {
    if (plan.features && plan.features.length > 0) {
      return plan.features
    }
    
    const baseFeatures = ['Access to all features', 'Cloud sync', 'Basic support']
    
    if (plan.price > 1000) {
      return [
        ...baseFeatures,
        'Unlimited access',
        'Advanced features',
        'Priority support',
        'Export features',
        'Team collaboration'
      ]
    } else if (plan.price > 500) {
      return [
        ...baseFeatures,
        'Up to 1000 items',
        'Advanced features',
        'Email support'
      ]
    }
    
    return baseFeatures
  }

  const isCurrentPlan = (planId: string): boolean => {
    return currentPlan === planId
  }

  const getTrialText = (plan: SubscriptionPlan): string | null => {
    if (plan.trialPeriodDays && plan.trialPeriodDays > 0) {
      return `${plan.trialPeriodDays}-day free trial`
    }
    return null
  }

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-[#0E315D]">Choose Your Plan</h2>
        <p className="mt-4 text-lg text-gray-600">
          Select the perfect plan for your needs
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3 lg:gap-6">
        {activePlans.map((plan: SubscriptionPlan) => {
          const isPopular = popularPlan?.id === plan.id
          const isCurrent = isCurrentPlan(plan.id)
          const features = getPlanFeatures(plan)
          const trialText = getTrialText(plan)

          return (
            <div
              key={plan.id}
              className={`relative rounded-2xl border-2 p-8 shadow-lg ${
                isPopular
                  ? 'border-[#502cef] ring-2 ring-[#502cef] ring-opacity-50'
                  : isCurrent
                  ? 'border-green-500 ring-2 ring-green-500 ring-opacity-50'
                  : 'border-gray-200'
              } ${loading ? 'opacity-50 pointer-events-none' : ''}`}
            >
              {isPopular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <div className="inline-flex items-center px-4 py-1 rounded-full text-sm font-medium bg-[#502cef] text-white">
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    Most Popular
                  </div>
                </div>
              )}

              {isCurrent && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <div className="inline-flex items-center px-4 py-1 rounded-full text-sm font-medium bg-green-500 text-white">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Current Plan
                  </div>
                </div>
              )}

              <div className="text-center">
                <h3 className="text-2xl font-bold text-[#0E315D]">{plan.name}</h3>
                {plan.description && (
                  <p className="mt-2 text-gray-600">{plan.description}</p>
                )}
                
                <div className="mt-6">
                  <div className="flex items-baseline justify-center">
                    <span className="text-5xl font-bold text-[#0E315D]">
                      {formatCurrency(plan.price, plan.currency)}
                    </span>
                    <span className="ml-2 text-xl text-gray-500">
                      {formatPlanInterval(plan.interval, plan.intervalCount)}
                    </span>
                  </div>
                  
                  {trialText && (
                    <p className="mt-2 text-sm text-[#502cef] font-medium">
                      {trialText}
                    </p>
                  )}
                </div>
              </div>

              <ul className="mt-8 space-y-4">
                {features.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <svg className="flex-shrink-0 w-5 h-5 text-green-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="ml-3 text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-8">
                {error && (
                  <p className="text-sm text-red-600 mb-2">{error}</p>
                )}
                {isCurrent ? (
                  <div className="w-full text-center py-3 px-4 border-2 border-green-500 rounded-lg text-green-700 font-medium bg-green-50">
                    Current Plan
                  </div>
                ) : (
                  <div className="space-y-2">
                    <CheckoutButton
                      planId={plan.id}
                      priceId={plan.stripePriceId || ''}
                      disabled={loading}
                    >
                      <div className={`w-full text-center py-3 px-4 rounded-lg font-medium transition-colors ${
                        isPopular
                          ? 'bg-[#502cef] text-white hover:bg-[#3d1fb8] focus:ring-[#502cef]'
                          : 'bg-[#0E315D] text-white hover:bg-[#0a2447] focus:ring-[#0E315D]'
                      } focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed`}>
                        {loading ? 'Loading...' : 'Get Started'}
                      </div>
                    </CheckoutButton>
                    <button
                      onClick={() => safeOnPlanSelect(plan.id)}
                      className="w-full inline-flex justify-center px-4 py-2 border border-gray-200 rounded-md text-sm font-medium text-[#0E315D] bg-white hover:bg-gray-50"
                    >
                      Select Plan
                    </button>
                  </div>
                )}
              </div>

              {plan.interval === 'year' && (
                <div className="mt-4 text-center">
                  <p className="text-sm text-green-600 font-medium">
                    Save {Math.round((1 - (plan.price * 12) / (plan.price * 12)) * 100) || 20}% with annual billing
                  </p>
                </div>
              )}
            </div>
          )
        })}
      </div>
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center space-x-6 text-sm text-gray-500">
          <div className="flex items-center">
            <svg className="w-4 h-4 mr-1 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Cancel anytime
          </div>
          <div className="flex items-center">
            <svg className="w-4 h-4 mr-1 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Secure payments
          </div>
          <div className="flex items-center">
            <svg className="w-4 h-4 mr-1 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            24/7 support
          </div>
        </div>
        
        <p className="text-sm text-gray-500">
          All plans include our core features. Upgrade or downgrade at any time.
        </p>
      </div>

      <div className="bg-gray-50 rounded-lg p-6">
        <h4 className="text-lg font-medium text-[#0E315D] mb-4">
          Need help choosing?
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
          <div>
            <p className="font-medium text-[#0E315D]">Free Trial</p>
            <p>Most plans include a free trial period to test all features.</p>
          </div>
          <div>
            <p className="font-medium text-[#0E315D]">Easy Upgrades</p>
            <p>Change your plan anytime from your billing dashboard.</p>
          </div>
          <div>
            <p className="font-medium text-[#0E315D]">Secure Billing</p>
            <p>All payments are processed securely through Stripe.</p>
          </div>
          <div>
            <p className="font-medium text-[#0E315D]">Cancel Anytime</p>
            <p>No long-term commitments. Cancel your subscription anytime.</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SubscriptionPlansView

