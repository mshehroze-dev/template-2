import React, { useState } from 'react'
import type { UserSubscription } from '../../lib/payment-types'
import { 
  formatPrice, 
  formatPlanInterval, 
  getDaysUntilRenewal,
  isInTrial,
  getTrialDaysRemaining 
} from '../../lib/subscription-validation'

interface SubscriptionCancellationDialogProps {
  isOpen: boolean
  onClose: () => void
  subscription: UserSubscription
  onCancel: (subscriptionId: string, cancelAtPeriodEnd: boolean) => void
  loading?: boolean
}

export const SubscriptionCancellationDialog: React.FC<SubscriptionCancellationDialogProps> = ({
  isOpen,
  onClose,
  subscription,
  onCancel,
  loading = false,
}) => {
  const [cancelAtPeriodEnd, setCancelAtPeriodEnd] = useState(true)
  const [confirmed, setConfirmed] = useState(false)
  const [feedback, setFeedback] = useState('')
  const [selectedReason, setSelectedReason] = useState('')
  const [error, setError] = useState<string | null>(null)

  const cancellationReasons = [
    'Too expensive',
    'Not using enough features',
    'Found a better alternative',
    'Technical issues',
    'Temporary pause',
    'Other'
  ]

  const handleCancel = async () => {
    if (!confirmed) return
    try {
      setError(null)
      await onCancel(subscription.id, cancelAtPeriodEnd)
    } catch (err) {
      console.error(err)
      setError('Failed to cancel subscription. Please try again.')
    }
  }

  const handleClose = () => {
    setCancelAtPeriodEnd(true)
    setConfirmed(false)
    setFeedback('')
    setSelectedReason('')
    onClose()
  }

  const getAccessEndDate = () => {
    if (isInTrial(subscription)) {
      return subscription.trialEnd!
    }
    return subscription.currentPeriodEnd
  }

  const getDaysUntilAccessEnd = () => {
    if (isInTrial(subscription)) {
      return getTrialDaysRemaining(subscription)
    }
    return getDaysUntilRenewal(subscription)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-10 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="fixed inset-0 bg-black bg-opacity-25" onClick={handleClose}></div>
        <div className="relative bg-white rounded-2xl p-6 shadow-xl max-w-lg w-full">
          <div className="flex items-center">
            <div className="flex-shrink-0 rounded-full bg-red-100 p-2">
              <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-[#0E315D]">
                Cancel Subscription
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                We're sorry to see you go
              </p>
            </div>
          </div>

          <div className="mt-6">
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <h4 className="text-sm font-medium text-[#0E315D] mb-2">Current Subscription</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Plan:</span>
                  <span className="text-sm font-medium text-[#0E315D]">
                    {subscription.plan?.name || 'Unknown Plan'}
                  </span>
                </div>
                {subscription.plan && (
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Price:</span>
                    <span className="text-sm font-medium text-[#0E315D]">
                      {formatPrice(subscription.plan.price, subscription.plan.currency)} / 
                      {formatPlanInterval(subscription.plan.interval, subscription.plan.intervalCount)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">
                    {isInTrial(subscription) ? 'Trial ends:' : 'Next billing:'}
                  </span>
                  <span className="text-sm font-medium text-[#0E315D]">
                    {new Date(getAccessEndDate()).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-4 mb-6">
              <h4 className="text-sm font-medium text-[#0E315D]">When would you like to cancel?</h4>
              
              <div className="space-y-3">
                <label className="flex items-start">
                  <input
                    type="radio"
                    checked={cancelAtPeriodEnd}
                    onChange={() => setCancelAtPeriodEnd(true)}
                    className="mt-1 h-4 w-4 text-[#502cef] focus:ring-[#502cef] border-gray-300"
                  />
                  <div className="ml-3">
                    <div className="text-sm font-medium text-[#0E315D]">
                      At the end of current period (Recommended)
                    </div>
                    <div className="text-sm text-gray-600">
                      You'll continue to have access for {getDaysUntilAccessEnd()} more days 
                      until {new Date(getAccessEndDate()).toLocaleDateString()}
                    </div>
                  </div>
                </label>
                
                <label className="flex items-start">
                  <input
                    type="radio"
                    checked={!cancelAtPeriodEnd}
                    onChange={() => setCancelAtPeriodEnd(false)}
                    className="mt-1 h-4 w-4 text-[#502cef] focus:ring-[#502cef] border-gray-300"
                  />
                  <div className="ml-3">
                    <div className="text-sm font-medium text-[#0E315D]">
                      Cancel immediately
                    </div>
                    <div className="text-sm text-gray-600">
                      You'll lose access right away. No refund will be provided for unused time.
                    </div>
                  </div>
                </label>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-[#0E315D] mb-2">
                Why are you canceling? (Optional)
              </label>
              <select
                value={selectedReason}
                onChange={(e) => setSelectedReason(e.target.value)}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-[#502cef] focus:ring-[#502cef] sm:text-sm"
              >
                <option value="">Select a reason...</option>
                {cancellationReasons.map((reason) => (
                  <option key={reason} value={reason}>
                    {reason}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-[#0E315D] mb-2">
                Additional feedback (Optional)
              </label>
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                rows={3}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-[#502cef] focus:ring-[#502cef] sm:text-sm"
                placeholder="Help us improve by sharing your experience..."
              />
            </div>

            <div className="mb-6">
              <label className="flex items-start">
                <input
                  type="checkbox"
                  checked={confirmed}
                  onChange={(e) => setConfirmed(e.target.checked)}
                  className="mt-1 h-4 w-4 text-[#502cef] focus:ring-[#502cef] border-gray-300 rounded"
                />
                <span className="ml-3 text-sm text-gray-700">
                  I understand that {cancelAtPeriodEnd ? 'my subscription will be canceled at the end of the current billing period' : 'my subscription will be canceled immediately and I will lose access right away'}.
                  {!cancelAtPeriodEnd && ' No refund will be provided.'}
                </span>
              </label>
            </div>

            {!cancelAtPeriodEnd && (
              <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">
                      Immediate Cancellation Warning
                    </h3>
                    <div className="mt-2 text-sm text-red-700">
                      <p>
                        You will lose access to all premium features immediately. 
                        This action cannot be undone and no refund will be provided for the remaining time.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="mt-6">
            {error && (
              <p className="text-sm text-red-600 mb-3">{error}</p>
            )}
            <div className="flex space-x-3">
              <button
                type="button"
                className="flex-1 inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-[#0E315D] hover:bg-gray-50"
                onClick={handleClose}
                disabled={loading}
              >
                Keep Subscription
              </button>
              <button
                type="button"
                className="flex-1 inline-flex justify-center rounded-md border border-transparent bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleCancel}
                disabled={loading || !confirmed}
              >
                {loading ? 'Canceling...' : `Cancel ${cancelAtPeriodEnd ? 'at Period End' : 'Immediately'}`}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

