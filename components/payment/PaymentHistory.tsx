import React, { useState, useEffect } from 'react'
import type { 
  PaymentHistoryProps, 
  PaymentHistoryType
} from '../../lib/payment-types'
import { 
  formatCurrency, 
  formatDateTime, 
  getPaymentStatusBadge,
  fetchPaymentHistory,
  handleStripeError
} from '../../lib/payment-utils'

interface PaymentHistoryState {
  payments: PaymentHistoryType[]
  loading: boolean
  error: string | null
  currentPage: number
  hasMore: boolean
}

const PaymentHistory: React.FC<PaymentHistoryProps> = ({ 
  customerId, 
  limit = 10, 
  showPagination = true 
}) => {
  const [state, setState] = useState<PaymentHistoryState>({
    payments: [],
    loading: true,
    error: null,
    currentPage: 1,
    hasMore: false
  })

  useEffect(() => {
    if (customerId) {
      loadPaymentHistory()
    }
  }, [customerId, state.currentPage])

  const loadPaymentHistory = async () => {
    if (!customerId) return

    try {
      setState(prev => ({ ...prev, loading: true, error: null }))
      
      const payments = await fetchPaymentHistory(
        customerId, 
        showPagination ? limit : limit * state.currentPage
      )
      
      setState(prev => ({
        ...prev,
        payments,
        loading: false,
        hasMore: payments.length === limit && showPagination
      }))
    } catch (error) {
      const paymentError = handleStripeError(error)
      setState(prev => ({
        ...prev,
        loading: false,
        error: paymentError.message
      }))
    }
  }

  const handlePageChange = (direction: 'prev' | 'next') => {
    setState(prev => ({
      ...prev,
      currentPage: direction === 'next' ? prev.currentPage + 1 : prev.currentPage - 1
    }))
  }

  const getPaymentIcon = (status: PaymentHistoryType['status'] | string) => {
    switch (status) {
      case 'succeeded':
        return (
          <svg className="h-5 w-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
      case 'canceled':
        return (
          <svg className="h-5 w-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
      case 'processing':
        return (
          <svg className="h-5 w-5 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
      case 'requires_action':
        return (
          <svg className="h-5 w-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        )
      default:
        return (
          <svg className="h-5 w-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
          </svg>
        )
    }
  }

  const getPaymentDescription = (payment: PaymentHistoryType): string => {
    if (payment.description) {
      return payment.description
    }
    
    switch (payment.status) {
      case 'succeeded':
        return 'Subscription payment'
      case 'canceled':
        return 'Payment canceled'
      case 'processing':
        return 'Payment processing'
      case 'requires_action':
        return 'Payment requires action'
      default:
        return 'Payment transaction'
    }
  }

  if (!customerId) {
    return (
      <div className="text-center py-8">
        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-[#0E315D]">No Payment History</h3>
        <p className="mt-1 text-sm text-gray-500">
          Payment history will appear here once you make your first payment.
        </p>
      </div>
    )
  }

  if (state.loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="animate-pulse flex items-center space-x-4 p-4">
            <div className="rounded-full bg-gray-200 h-10 w-10"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
            <div className="h-4 bg-gray-200 rounded w-20"></div>
          </div>
        ))}
      </div>
    )
  }

  if (state.error) {
    return (
      <div className="text-center py-8">
        <svg className="mx-auto h-12 w-12 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-red-900">Error Loading Payment History</h3>
        <p className="mt-1 text-sm text-red-600">{state.error}</p>
        <button
          onClick={loadPaymentHistory}
          className="mt-4 inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    )
  }

  if (state.payments.length === 0) {
    return (
      <div className="text-center py-8">
        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-[#0E315D]">No Payment History</h3>
        <p className="mt-1 text-sm text-gray-500">
          Your payment history will appear here once you make your first payment.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {state.payments.map((payment) => (
          <div
            key={payment.id}
            className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center space-x-4">
              <div className="flex-shrink-0">
                {getPaymentIcon(payment.status)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <p className="text-sm font-medium text-[#0E315D] truncate">
                    {getPaymentDescription(payment)}
                  </p>
                  <span className={getPaymentStatusBadge(payment.status)}>
                    {payment.status.replace('_', ' ').toUpperCase()}
                  </span>
                </div>
                <p className="text-sm text-gray-500">
                  {formatDateTime(payment.createdAt)}
                </p>
              </div>
            </div>
            <div className="flex-shrink-0 text-right">
              <p className={`text-sm font-medium ${
                payment.status === 'succeeded' ? 'text-[#0E315D]' : 'text-gray-500'
              }`}>
                {formatCurrency(payment.amount, payment.currency)}
              </p>
              {payment.id && (
                <p className="text-xs text-gray-400 font-mono">
                  {payment.id.slice(-8)}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {showPagination && (
        <div className="flex items-center justify-between border-t border-gray-200 pt-4">
          <button
            onClick={() => handlePageChange('prev')}
            disabled={state.currentPage === 1}
            className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-[#0E315D] bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <span className="text-sm text-gray-700">
            Page {state.currentPage}
          </span>
          <button
            onClick={() => handlePageChange('next')}
            disabled={!state.hasMore}
            className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-[#0E315D] bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}
    </div>
  )
}

export default PaymentHistory

