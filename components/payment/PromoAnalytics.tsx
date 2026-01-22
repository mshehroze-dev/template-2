import React, { useState, useEffect } from 'react'
import { getPromoUsageAnalytics } from '../../lib/stripe'
import type { PromoUsageAnalytics, AnalyticsResponse } from '../../lib/stripe'
import { formatCurrency } from '../../lib/discount-utils'

interface PromoAnalyticsProps {
  promoCode?: string
  className?: string
  dateRange?: {
    startDate: string
    endDate: string
  }
}

export const PromoAnalytics: React.FC<PromoAnalyticsProps> = ({
  promoCode,
  className = '',
  dateRange
}) => {
  const [analytics, setAnalytics] = useState<PromoUsageAnalytics | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadAnalytics()
  }, [promoCode, dateRange])

  const loadAnalytics = async () => {
    setLoading(true)
    setError(null)

    try {
      const response: AnalyticsResponse = await getPromoUsageAnalytics({
        promoCode,
        startDate: dateRange?.startDate,
        endDate: dateRange?.endDate,
        limit: 10,
      })

      setAnalytics(response.data as PromoUsageAnalytics)
    } catch (err) {
      console.error('Failed to load promo analytics:', err)
      setError(err instanceof Error ? err.message : 'Failed to load analytics')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
        <div className="text-center">
          <svg className="h-12 w-12 text-red-500 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <h3 className="text-lg font-medium text-[#0E315D] mb-2">Analytics Error</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={loadAnalytics}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-[#502cef] hover:bg-[#3d1fb8]"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  if (!analytics) {
    return null
  }

  return (
    <div className={`bg-white rounded-lg shadow ${className}`}>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-medium text-[#0E315D]">
            Promotional Code Analytics
            {analytics.promoCode !== 'ALL_CODES' && (
              <span className="ml-2 text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                {analytics.promoCode}
              </span>
            )}
          </h3>
          <button
            onClick={loadAnalytics}
            className="text-sm text-[#502cef] hover:text-[#3d1fb8]"
          >
            Refresh
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center">
              <svg className="h-8 w-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
              <div className="ml-3">
                <p className="text-sm font-medium text-blue-600">Total Redemptions</p>
                <p className="text-2xl font-bold text-blue-900">{analytics.totalRedemptions.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center">
              <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="ml-3">
                <p className="text-sm font-medium text-green-600">Total Discount</p>
                <p className="text-2xl font-bold text-green-900">
                  {formatCurrency(analytics.totalDiscountAmount, analytics.currency)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-purple-50 rounded-lg p-4">
            <div className="flex items-center">
              <svg className="h-8 w-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <div className="ml-3">
                <p className="text-sm font-medium text-purple-600">Avg Order Value</p>
                <p className="text-2xl font-bold text-purple-900">
                  {formatCurrency(analytics.averageOrderValue, analytics.currency)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-orange-50 rounded-lg p-4">
            <div className="flex items-center">
              <svg className="h-8 w-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="ml-3">
                <p className="text-sm font-medium text-orange-600">Revenue Impact</p>
                <p className="text-2xl font-bold text-orange-900">
                  {formatCurrency(analytics.revenueImpact, analytics.currency)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

interface DateRangePickerProps {
  startDate: string
  endDate: string
  onChange: (startDate: string, endDate: string) => void
  className?: string
}

export const DateRangePicker: React.FC<DateRangePickerProps> = ({
  startDate,
  endDate,
  onChange,
  className = ''
}) => {
  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value, endDate)
  }

  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(startDate, e.target.value)
  }

  const setPresetRange = (days: number) => {
    const end = new Date()
    const start = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
    onChange(start.toISOString().split('T')[0], end.toISOString().split('T')[0])
  }

  return (
    <div className={`flex flex-wrap items-center gap-4 ${className}`}>
      <div className="flex items-center space-x-2">
        <label htmlFor="start-date" className="text-sm font-medium text-[#0E315D]">
          From:
        </label>
        <input
          id="start-date"
          type="date"
          value={startDate}
          onChange={handleStartDateChange}
          className="block w-auto rounded-md border-gray-300 shadow-sm focus:border-[#502cef] focus:ring-[#502cef] sm:text-sm"
        />
      </div>

      <div className="flex items-center space-x-2">
        <label htmlFor="end-date" className="text-sm font-medium text-[#0E315D]">
          To:
        </label>
        <input
          id="end-date"
          type="date"
          value={endDate}
          onChange={handleEndDateChange}
          className="block w-auto rounded-md border-gray-300 shadow-sm focus:border-[#502cef] focus:ring-[#502cef] sm:text-sm"
        />
      </div>

      <div className="flex space-x-2">
        <button
          onClick={() => setPresetRange(7)}
          className="px-3 py-1 text-xs font-medium text-[#0E315D] bg-gray-100 rounded-md hover:bg-gray-200"
        >
          Last 7 days
        </button>
        <button
          onClick={() => setPresetRange(30)}
          className="px-3 py-1 text-xs font-medium text-[#0E315D] bg-gray-100 rounded-md hover:bg-gray-200"
        >
          Last 30 days
        </button>
        <button
          onClick={() => setPresetRange(90)}
          className="px-3 py-1 text-xs font-medium text-[#0E315D] bg-gray-100 rounded-md hover:bg-gray-200"
        >
          Last 90 days
        </button>
      </div>
    </div>
  )
}

