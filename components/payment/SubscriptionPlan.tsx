import React, { useState } from 'react'
import { supabase } from '../../lib/supabase'

interface SubscriptionPlanProps {
  planId: string
  name: string
  description: string
  price: number
  interval: 'month' | 'year'
  trialDays?: number
  features: string[]
  popular?: boolean
  className?: string
  onSubscribe?: (planId: string) => void
  onError?: (error: string) => void
}

export const SubscriptionPlan: React.FC<SubscriptionPlanProps> = ({
  planId,
  name,
  description,
  price,
  interval,
  trialDays = 0,
  features,
  popular = false,
  className = '',
  onSubscribe,
  onError
}) => {
  const [loading, setLoading] = useState(false)

  const handleSubscribe = async () => {
    if (!planId) {
      onError?.('Invalid subscription plan')
      return
    }

    setLoading(true)
    
    try {
      const { data, error } = await supabase.functions.invoke('create-subscription', {
        body: {
          priceId: planId,
          trialDays,
          successUrl: `${window.location.origin}/payment/success?type=subscription`,
          cancelUrl: `${window.location.origin}/payment/cancel`,
        }
      })

      if (error) {
        throw new Error(error.message)
      }

      const sessionId = data?.sessionId

      const { getStripe } = await import('../../lib/stripe')
      const stripe = await getStripe()
      if (!stripe) {
        throw new Error('Failed to load Stripe. Please install @stripe/stripe-js')
      }

      const { error: stripeError } = await stripe.redirectToCheckout({ sessionId })
      
      if (stripeError) {
        throw new Error(stripeError.message)
      }

      onSubscribe?.(planId)
    } catch (err) {
      console.error('Subscription error:', err)
      onError?.(err instanceof Error ? err.message : 'Subscription failed')
    } finally {
      setLoading(false)
    }
  }

  const formatPrice = (price: number, interval: string) => {
    const dollars = (price / 100).toFixed(2)
    return `${dollars}/${interval}`
  }

  const baseClassName = `
    relative rounded-2xl border p-8 shadow-sm flex flex-col
    ${popular 
      ? 'border-[#502cef] ring-2 ring-[#502cef]' 
      : 'border-gray-200'
    }
  `.trim()

  return (
    <div className={className || baseClassName}>
      {popular && (
        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
          <span className="inline-flex items-center rounded-full bg-[#502cef] px-4 py-1 text-sm font-medium text-white">
            Most Popular
          </span>
        </div>
      )}

      <div className="flex-1">
        <h3 className="text-xl font-semibold text-[#0E315D]">{name}</h3>
        <p className="mt-4 text-sm text-gray-700">{description}</p>
        
        <p className="mt-6">
          <span className="text-4xl font-bold tracking-tight text-[#0E315D]">
            {formatPrice(price, interval)}
          </span>
        </p>

        {trialDays > 0 && (
          <p className="mt-2 text-sm text-green-600 font-medium">
            {trialDays}-day free trial
          </p>
        )}

        <ul className="mt-6 space-y-3">
          {features.map((feature, index) => (
            <li key={index} className="flex">
              <svg className="h-5 w-5 text-[#502cef] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="ml-3 text-sm text-gray-700">{feature}</span>
            </li>
          ))}
        </ul>
      </div>

      <button
        onClick={handleSubscribe}
        disabled={loading}
        className={`
          mt-8 w-full rounded-md px-4 py-2 text-sm font-semibold focus:outline-none 
          focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed
          transition-colors duration-200
          ${popular
            ? 'bg-[#502cef] text-white hover:bg-[#3d1fb8] focus:ring-[#502cef]'
            : 'bg-gray-50 text-[#0E315D] hover:bg-gray-100 focus:ring-gray-500 border border-gray-300'
          }
        `.trim()}
      >
        {loading ? (
          <div className="flex items-center justify-center">
            <svg className="animate-spin -ml-1 mr-3 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Processing...
          </div>
        ) : (
          `Subscribe to ${name}`
        )}
      </button>
    </div>
  )
}

