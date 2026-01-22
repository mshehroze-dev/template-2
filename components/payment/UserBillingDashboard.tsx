import React, { useState, useEffect } from 'react'
import type { 
  BillingDashboardProps, 
  UserSubscription,
  Customer
} from '../../lib/payment-types'
import { 
  formatDate, 
  getSubscriptionStatusBadge, 
  isSubscriptionActive, 
  subscriptionNeedsAttention, 
  getDaysUntilSubscriptionEnd,
  createCustomerPortalSession,
  handleStripeError
} from '../../lib/payment-utils'
import { isInTrial } from '../../lib/subscription-validation'
import PaymentHistory from './PaymentHistory'

interface BillingData {
  subscription: any | null
  customer: Customer | null
  loading: boolean
  error: string | null
}

const UserBillingDashboard: React.FC<BillingDashboardProps> = ({ 
  subscription,
  customer
}) => {
  const [billingData, setBillingData] = useState<BillingData>({
    subscription: null,
    customer: null,
    loading: true,
    error: null
  })

  const [portalLoading, setPortalLoading] = useState(false)

  useEffect(() => {
    if (subscription || customer) {
      setBillingData({
        subscription: subscription || null,
        customer: customer || null,
        loading: false,
        error: null
      })
    }
  }, [subscription, customer])

  const handleManageSubscription = async () => {
    if (!customer?.stripeCustomerId) return

    try {
      setPortalLoading(true)
      const url = await createCustomerPortalSession(
        customer.stripeCustomerId
      )
      window.location.href = url
    } catch (error) {
      const paymentError = handleStripeError(error)
      setBillingData(prev => ({ ...prev, error: paymentError.message }))
    } finally {
      setPortalLoading(false)
    }
  }

  const renderSubscriptionStatus = () => {
    const { subscription } = billingData

    if (!subscription) {
      return (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-center">
            <svg className="h-8 w-8 text-blue-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <h3 className="text-lg font-medium text-blue-900">No Active Subscription</h3>
              <p className="text-blue-700 mt-1">
                Subscribe to a plan to access premium features.
              </p>
            </div>
          </div>
          <div className="mt-4">
            <a
              href="/checkout"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-[#502cef] hover:bg-[#3d1fb8]"
            >
              View Plans
            </a>
          </div>
        </div>
      )
    }

    const isActive = subscription?.status ? isSubscriptionActive(subscription as UserSubscription) : false
    const needsAttention = subscription?.status ? subscriptionNeedsAttention(subscription as UserSubscription) : false
    const inTrial = subscription ? isInTrial(subscription as UserSubscription) : false
    const daysUntilEnd = subscription?.current_period_end ? getDaysUntilSubscriptionEnd(subscription as UserSubscription) : 0

    return (
      <div className={`border rounded-lg p-6 ${
        needsAttention ? 'bg-red-50 border-red-200' : 
        inTrial ? 'bg-blue-50 border-blue-200' : 
        'bg-green-50 border-green-200'
      }`}>
        <div className="flex items-start justify-between">
          <div className="flex items-center">
            {isActive ? (
              <svg className="h-8 w-8 text-green-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ) : (
              <svg className="h-8 w-8 text-red-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            )}
            <div>
              <h3 className="text-lg font-medium text-[#0E315D]">
                Current Subscription
              </h3>
              <div className="mt-1">
                <span className={subscription?.status ? getSubscriptionStatusBadge(subscription.status) : ''}>
                  {subscription?.status ? subscription.status.replace('_', ' ').toUpperCase() : 'N/A'}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={handleManageSubscription}
            disabled={portalLoading}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-[#0E315D] bg-white hover:bg-gray-50 disabled:opacity-50"
          >
            {portalLoading ? 'Loading...' : 'Manage'}
          </button>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-sm font-medium text-gray-500">Current Period</dt>
            <dd className="mt-1 text-sm text-[#0E315D]">
              {subscription && 'currentPeriodStart' in subscription ? formatDate((subscription as UserSubscription).currentPeriodStart) : 'N/A'} - {subscription && 'currentPeriodEnd' in subscription ? formatDate((subscription as UserSubscription).currentPeriodEnd) : 'N/A'}
            </dd>
          </div>
          
          {inTrial && subscription && 'trialEnd' in subscription && (subscription as UserSubscription).trialEnd && (
            <div>
              <dt className="text-sm font-medium text-gray-500">Trial Ends</dt>
              <dd className="mt-1 text-sm text-[#0E315D]">
                {formatDate((subscription as UserSubscription).trialEnd!)}
              </dd>
            </div>
          )}

          <div>
            <dt className="text-sm font-medium text-gray-500">
              {inTrial ? 'Trial Status' : 'Next Billing'}
            </dt>
            <dd className="mt-1 text-sm text-[#0E315D]">
              {inTrial && subscription && 'trialEnd' in subscription && (subscription as UserSubscription).trialEnd
                ? `${getDaysUntilSubscriptionEnd(subscription as UserSubscription)} days remaining`
                : daysUntilEnd > 0 
                  ? `${daysUntilEnd} days`
                  : 'Overdue'
              }
            </dd>
          </div>

          {subscription && 'cancelAtPeriodEnd' in subscription && (subscription as UserSubscription).cancelAtPeriodEnd && (
            <div>
              <dt className="text-sm font-medium text-gray-500">Cancellation</dt>
              <dd className="mt-1 text-sm text-red-600">
                Ends {subscription && 'currentPeriodEnd' in subscription ? formatDate((subscription as UserSubscription).currentPeriodEnd) : 'N/A'}
              </dd>
            </div>
          )}
        </div>

        {needsAttention && (
          <div className="mt-4 p-3 bg-red-100 border border-red-200 rounded-md">
            <p className="text-sm text-red-800">
              Your subscription needs attention. Please update your payment method or contact support.
            </p>
          </div>
        )}
      </div>
    )
  }

  if (billingData.loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="bg-gray-200 rounded-lg h-48"></div>
        </div>
        <div className="animate-pulse">
          <div className="bg-gray-200 rounded-lg h-64"></div>
        </div>
      </div>
    )
  }

  if (billingData.error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center">
          <svg className="h-8 w-8 text-red-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div>
            <h3 className="text-lg font-medium text-red-900">Error Loading Billing Data</h3>
            <p className="text-red-700 mt-1">{billingData.error}</p>
          </div>
        </div>
        <div className="mt-4">
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {renderSubscriptionStatus()}

      {billingData.customer && (
        <div className="bg-white border border-gray-200 rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center">
              <svg className="h-6 w-6 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
              <h3 className="text-lg font-medium text-[#0E315D]">Payment History</h3>
            </div>
          </div>
          <div className="p-6">
            <PaymentHistory 
              customerId={billingData.customer.stripeCustomerId}
              limit={5}
            />
          </div>
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-[#0E315D] mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <a
            href="/checkout"
            className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-[#0E315D] bg-white hover:bg-gray-50"
          >
            <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            View Plans
          </a>
          {billingData.customer && (
            <button
              onClick={handleManageSubscription}
              disabled={portalLoading}
              className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-[#0E315D] bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
              {portalLoading ? 'Loading...' : 'Manage Billing'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default UserBillingDashboard

