import React, { useState } from 'react'
import type { SubscriptionPlan, UserSubscription } from '../../lib/payment-types'
import { 
  formatPrice, 
  formatPlanInterval, 
  getChangeType,
  validatePlanChange 
} from '../../lib/subscription-validation'

interface PlanChangeDialogProps {
  isOpen: boolean
  onClose: () => void
  currentSubscription: UserSubscription
  newPlan: SubscriptionPlan
  currentPlan: SubscriptionPlan
  onConfirm: (planId: string) => void
  loading?: boolean
}

export const PlanChangeDialog: React.FC<PlanChangeDialogProps> = ({
  isOpen,
  onClose,
  currentSubscription,
  newPlan,
  currentPlan,
  onConfirm,
  loading = false,
}) => {
  const [confirmed, setConfirmed] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!isOpen) return null

  const changeType = getChangeType(currentPlan, newPlan)
  const validation = validatePlanChange(currentSubscription, newPlan)

  const handleConfirm = async () => {
    if (!validation.valid) return
    try {
      setError(null)
      await onConfirm(newPlan.id)
    } catch (err) {
      console.error(err)
      setError('Failed to change plan. Please try again.')
    }
  }

  const getChangeDescription = () => {
    switch (changeType) {
      case 'upgrade':
        return {
          title: 'Upgrade Plan',
          description: 'Your plan will be upgraded immediately and you\'ll be charged a prorated amount for the remainder of your billing cycle.',
          effectiveDate: 'Effective immediately',
        }
      case 'downgrade':
        return {
          title: 'Downgrade Plan',
          description: 'Your plan will be downgraded at the end of your current billing cycle. You\'ll continue to have access to your current features until then.',
          effectiveDate: `Effective ${new Date(currentSubscription.currentPeriodEnd).toLocaleDateString()}`,
        }
      case 'lateral':
        return {
          title: 'Change Plan',
          description: 'Your plan will be changed immediately. Any price difference will be prorated for the remainder of your billing cycle.',
          effectiveDate: 'Effective immediately',
        }
    }
  }

  const changeInfo = getChangeDescription()

  if (!validation.valid) {
    return (
      <div className="fixed inset-0 z-10 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4">
          <div className="fixed inset-0 bg-black bg-opacity-25" onClick={onClose}></div>
          <div className="relative bg-white rounded-2xl p-6 shadow-xl max-w-md w-full">
            <div className="flex items-center">
              <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              <div className="ml-3">
                <h3 className="text-lg font-medium text-[#0E315D]">
                  Cannot Change Plan
                </h3>
                <div className="mt-2">
                  <p className="text-sm text-gray-500">
                    {validation.error}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6">
              <button
                type="button"
                className="inline-flex justify-center rounded-md border border-transparent bg-gray-100 px-4 py-2 text-sm font-medium text-[#0E315D] hover:bg-gray-200"
                onClick={onClose}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-10 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="fixed inset-0 bg-black bg-opacity-25" onClick={onClose}></div>
        <div className="relative bg-white rounded-2xl p-6 shadow-xl max-w-lg w-full">
          <div className="flex items-center">
            <div className={`flex-shrink-0 rounded-full p-2 ${
              changeType === 'upgrade' ? 'bg-green-100' : 
              changeType === 'downgrade' ? 'bg-yellow-100' : 
              'bg-blue-100'
            }`}>
              {changeType === 'upgrade' ? (
                <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-[#0E315D]">
                {changeInfo.title}
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                {changeInfo.effectiveDate}
              </p>
            </div>
          </div>

          <div className="mt-6">
            <p className="text-sm text-gray-700">
              {changeInfo.description}
            </p>
          </div>

          <div className="mt-6 bg-gray-50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-[#0E315D] mb-3">Plan Change Summary</h4>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Current Plan:</span>
                <div className="text-right">
                  <div className="text-sm font-medium text-[#0E315D]">{currentPlan.name}</div>
                  <div className="text-xs text-gray-500">
                    {formatPrice(currentPlan.price, currentPlan.currency)} / {formatPlanInterval(currentPlan.interval, currentPlan.intervalCount)}
                  </div>
                </div>
              </div>
              
              <div className="border-t border-gray-200 pt-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">New Plan:</span>
                  <div className="text-right">
                    <div className="text-sm font-medium text-[#0E315D]">{newPlan.name}</div>
                    <div className="text-xs text-gray-500">
                      {formatPrice(newPlan.price, newPlan.currency)} / {formatPlanInterval(newPlan.interval, newPlan.intervalCount)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {changeType === 'downgrade' && (
            <div className="mt-6">
              <label className="flex items-start">
                <input
                  type="checkbox"
                  checked={confirmed}
                  onChange={(e) => setConfirmed(e.target.checked)}
                  className="mt-1 h-4 w-4 text-[#502cef] focus:ring-[#502cef] border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">
                  I understand that I will lose access to features not included in the new plan at the end of my current billing cycle.
                </span>
              </label>
            </div>
          )}

          <div className="mt-6">
            {error && (
              <p className="text-sm text-red-600 mb-3">{error}</p>
            )}
            <div className="flex space-x-3">
              <button
                type="button"
                className="flex-1 inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-[#0E315D] hover:bg-gray-50"
                onClick={onClose}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="button"
                className="flex-1 inline-flex justify-center rounded-md border border-transparent bg-[#502cef] px-4 py-2 text-sm font-medium text-white hover:bg-[#3d1fb8] disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleConfirm}
                disabled={loading || (changeType === 'downgrade' && !confirmed)}
              >
                {loading ? 'Processing...' : `Confirm ${changeType === 'upgrade' ? 'Upgrade' : changeType === 'downgrade' ? 'Downgrade' : 'Change'}`}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

