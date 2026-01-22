import React, { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../auth/AuthProvider'
import { formatAmount } from '../../lib/stripe'

interface Invoice {
  id: string
  customer_id: string
  subscription_id: string | null
  stripe_invoice_id: string
  amount_paid: number
  amount_due: number
  status: string
  invoice_pdf: string | null
  created_at: string
}

interface InvoiceListProps {
  className?: string
  limit?: number
  showFilters?: boolean
  customerId?: string
}

export const InvoiceList: React.FC<InvoiceListProps> = ({
  className = '',
  limit = 20,
  showFilters = true,
  customerId
}) => {
  const { user } = useAuth()
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [dateFilter, setDateFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'date' | 'amount'>('date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  useEffect(() => {
    if (!user && !customerId) return

    const fetchInvoices = async () => {
      setLoading(true)
      setError(null)

      try {
        let customerIdToUse = customerId

        if (!customerIdToUse && user) {
          const { data: customerData, error: customerError } = await supabase
            .from('customers')
            .select('id')
            .eq('user_id', user.id)
            .single()

          if (customerError) {
            if (customerError.code === 'PGRST116') {
              setInvoices([])
              return
            }
            throw customerError
          }

          customerIdToUse = customerData.id
        }

        if (!customerIdToUse) {
          setInvoices([])
          return
        }

        let query = supabase
          .from('invoices')
          .select('*')
          .eq('customer_id', customerIdToUse)

        if (statusFilter !== 'all') {
          query = query.eq('status', statusFilter)
        }

        if (dateFilter !== 'all') {
          const now = new Date()
          let startDate: Date

          switch (dateFilter) {
            case 'week':
              startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
              break
            case 'month':
              startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
              break
            case 'quarter':
              startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
              break
            case 'year':
              startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
              break
            default:
              startDate = new Date(0)
          }

          query = query.gte('created_at', startDate.toISOString())
        }

        const sortColumn = sortBy === 'date' ? 'created_at' : 'amount_paid'
        query = query.order(sortColumn, { ascending: sortOrder === 'asc' })

        if (limit > 0) {
          query = query.limit(limit)
        }

        const { data, error } = await query

        if (error) {
          if (error.code === 'PGRST106' || error.message.includes('relation "invoices" does not exist')) {
            console.warn('invoices table does not exist')
            setInvoices([])
            return
          }
          throw error
        }

        setInvoices(data || [])
      } catch (err) {
        console.error('Error fetching invoices:', err)
        setError('Failed to load invoices')
      } finally {
        setLoading(false)
      }
    }

    fetchInvoices()
  }, [user, customerId, statusFilter, dateFilter, sortBy, sortOrder, limit])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'paid':
        return (
          <svg className="h-5 w-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
      case 'open':
        return (
          <svg className="h-5 w-5 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
      case 'void':
      case 'uncollectible':
        return (
          <svg className="h-5 w-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
      default:
        return (
          <svg className="h-5 w-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        )
    }
  }

  const getStatusBadge = (status: string) => {
    const baseClasses = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium'
    
    switch (status.toLowerCase()) {
      case 'paid':
        return `${baseClasses} bg-green-100 text-green-800`
      case 'open':
        return `${baseClasses} bg-yellow-100 text-yellow-800`
      case 'void':
        return `${baseClasses} bg-gray-100 text-gray-800`
      case 'uncollectible':
        return `${baseClasses} bg-red-100 text-red-800`
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`
    }
  }

  const handleDownloadInvoice = async (invoice: Invoice) => {
    if (!invoice.invoice_pdf) {
      console.warn('No PDF available for invoice:', invoice.stripe_invoice_id)
      return
    }

    try {
      window.open(invoice.invoice_pdf, '_blank')
    } catch (error) {
      console.error('Failed to download invoice:', error)
    }
  }

  const handleViewInvoice = (invoice: Invoice) => {
    console.log('View invoice details:', invoice.stripe_invoice_id)
    if (invoice.invoice_pdf) {
      handleDownloadInvoice(invoice)
    }
  }

  const calculateTotalPaid = () => {
    return invoices
      .filter(invoice => invoice.status === 'paid')
      .reduce((total, invoice) => total + invoice.amount_paid, 0)
  }

  const calculateTotalDue = () => {
    return invoices
      .filter(invoice => invoice.status === 'open')
      .reduce((total, invoice) => total + invoice.amount_due, 0)
  }

  if (loading) {
    return (
      <div className={`${className} animate-pulse`}>
        <div className="space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          {showFilters && (
            <div className="flex space-x-4">
              <div className="h-10 bg-gray-200 rounded w-32"></div>
              <div className="h-10 bg-gray-200 rounded w-32"></div>
              <div className="h-10 bg-gray-200 rounded w-32"></div>
            </div>
          )}
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-gray-200 h-20 rounded-lg"></div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`${className} bg-red-50 border border-red-200 rounded-lg p-6`}>
        <div className="text-center">
          <svg className="h-12 w-12 text-red-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="text-lg font-medium text-red-800 mb-2">Error Loading Invoices</h3>
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-medium text-[#0E315D]">Invoices</h3>
          {invoices.length > 0 && (
            <p className="text-sm text-gray-600 mt-1">
              {invoices.length} invoice{invoices.length !== 1 ? 's' : ''} found
            </p>
          )}
        </div>
        
        {showFilters && (
          <div className="flex space-x-4">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-sm border-gray-300 rounded-md focus:ring-[#502cef] focus:border-[#502cef]"
            >
              <option value="all">All Status</option>
              <option value="paid">Paid</option>
              <option value="open">Open</option>
              <option value="void">Void</option>
              <option value="uncollectible">Uncollectible</option>
            </select>
            
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="text-sm border-gray-300 rounded-md focus:ring-[#502cef] focus:border-[#502cef]"
            >
              <option value="all">All Time</option>
              <option value="week">Last Week</option>
              <option value="month">Last Month</option>
              <option value="quarter">Last Quarter</option>
              <option value="year">Last Year</option>
            </select>

            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [newSortBy, newSortOrder] = e.target.value.split('-') as ['date' | 'amount', 'asc' | 'desc']
                setSortBy(newSortBy)
                setSortOrder(newSortOrder)
              }}
              className="text-sm border-gray-300 rounded-md focus:ring-[#502cef] focus:border-[#502cef]"
            >
              <option value="date-desc">Newest First</option>
              <option value="date-asc">Oldest First</option>
              <option value="amount-desc">Highest Amount</option>
              <option value="amount-asc">Lowest Amount</option>
            </select>
          </div>
        )}
      </div>

      {invoices.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center">
              <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="ml-3">
                <p className="text-sm font-medium text-green-600">Total Paid</p>
                <p className="text-xl font-bold text-green-900">
                  {formatAmount(calculateTotalPaid())}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 rounded-lg p-4">
            <div className="flex items-center">
              <svg className="h-8 w-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="ml-3">
                <p className="text-sm font-medium text-yellow-600">Amount Due</p>
                <p className="text-xl font-bold text-yellow-900">
                  {formatAmount(calculateTotalDue())}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center">
              <svg className="h-8 w-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <div className="ml-3">
                <p className="text-sm font-medium text-blue-600">Total Invoices</p>
                <p className="text-xl font-bold text-blue-900">{invoices.length}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {invoices.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <svg className="h-12 w-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="text-lg font-medium text-[#0E315D] mb-2">No Invoices Found</h3>
          <p className="text-gray-600">
            {statusFilter !== 'all' || dateFilter !== 'all' 
              ? 'No invoices match your current filters. Try adjusting your search criteria.'
              : 'No invoices have been generated yet.'
            }
          </p>
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {invoices.map((invoice) => (
              <li key={invoice.id}>
                <div className="px-4 py-4 sm:px-6 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center flex-1">
                      <div className="flex-shrink-0">
                        {getStatusIcon(invoice.status)}
                      </div>
                      
                      <div className="ml-4 flex-1">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-[#0E315D]">
                              Invoice #{invoice.stripe_invoice_id.substring(3, 15)}...
                            </p>
                            <p className="text-sm text-gray-500">
                              {formatDate(invoice.created_at)}
                            </p>
                          </div>
                          
                          <div className="text-right">
                            <p className="text-lg font-semibold text-[#0E315D]">
                              {invoice.status === 'paid' 
                                ? formatAmount(invoice.amount_paid)
                                : formatAmount(invoice.amount_due)
                              }
                            </p>
                            <span className={getStatusBadge(invoice.status)}>
                              {invoice.status}
                            </span>
                          </div>
                        </div>
                        
                        {invoice.subscription_id && (
                          <p className="text-xs text-gray-400 mt-1">
                            Subscription invoice
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div className="ml-4 flex space-x-2">
                      <button
                        onClick={() => handleViewInvoice(invoice)}
                        className="text-[#502cef] hover:text-[#3d1fb8] p-1"
                        title="View invoice"
                      >
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </button>
                      
                      {invoice.invoice_pdf && (
                        <button
                          onClick={() => handleDownloadInvoice(invoice)}
                          className="text-gray-600 hover:text-gray-900 p-1"
                          title="Download PDF"
                        >
                          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

