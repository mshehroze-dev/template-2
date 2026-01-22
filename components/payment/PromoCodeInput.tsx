import React, { useState } from 'react'
import { validatePromoCodeFormat } from '../../lib/discount-utils'

interface PromoCode {
  id: string
  code: string
  discount_type: 'percentage' | 'fixed'
  discount_value: number
  currency?: string
  valid: boolean
  error?: string
}

interface PromoCodeInputProps {
  onCodeApplied?: (promoCode: PromoCode) => void
  onCodeRemoved?: () => void
  className?: string
  placeholder?: string
  disabled?: boolean
  appliedCode?: PromoCode | null
}

export const PromoCodeInput: React.FC<PromoCodeInputProps> = ({
  onCodeApplied,
  onCodeRemoved,
  className = '',
  placeholder = 'Enter promo code',
  disabled = false,
  appliedCode = null
}) => {
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [validationResult, setValidationResult] = useState<PromoCode | null>(appliedCode)

  const validatePromoCode = async (promoCode: string) => {
    const formatValidation = validatePromoCodeFormat(promoCode)
    if (!formatValidation.valid) {
      setError(formatValidation.error || 'Invalid promo code format')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/validate-promo-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code: promoCode.trim().toUpperCase() }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to validate promo code')
      }

      if (result.valid) {
        const validPromoCode: PromoCode = {
          id: result.id,
          code: result.code,
          discount_type: result.discount_type,
          discount_value: result.discount_value,
          currency: result.currency,
          valid: true,
        }
        
        setValidationResult(validPromoCode)
        onCodeApplied?.(validPromoCode)
        setError(null)
      } else {
        setError(result.error || 'Invalid promo code')
        setValidationResult(null)
      }
    } catch (err) {
      console.error('Promo code validation error:', err)
      setError(err instanceof Error ? err.message : 'Failed to validate promo code')
      setValidationResult(null)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    validatePromoCode(code)
  }

  const handleRemoveCode = () => {
    setCode('')
    setValidationResult(null)
    setError(null)
    onCodeRemoved?.()
  }

  const formatDiscountDisplay = (promoCode: PromoCode) => {
    if (promoCode.discount_type === 'percentage') {
      return `${promoCode.discount_value}% off`
    } else {
      const amount = (promoCode.discount_value / 100).toFixed(2)
      return `${amount} off`
    }
  }

  const baseClassName = `
    border border-gray-300 rounded-lg p-4 bg-white
    ${className}
  `.trim()

  if (validationResult?.valid) {
    return (
      <div className={baseClassName}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <svg className="h-5 w-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="text-sm font-medium text-[#0E315D]">
                Promo code applied: <span className="font-mono">{validationResult.code}</span>
              </p>
              <p className="text-sm text-green-600">
                {formatDiscountDisplay(validationResult)}
              </p>
            </div>
          </div>
          
          <button
            onClick={handleRemoveCode}
            disabled={disabled}
            className="text-sm text-red-600 hover:text-red-800 font-medium disabled:opacity-50"
          >
            Remove
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={baseClassName}>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label htmlFor="promo-code" className="block text-sm font-medium text-[#0E315D] mb-2">
            Promo Code
          </label>
          
          <div className="flex space-x-2">
            <input
              id="promo-code"
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder={placeholder}
              disabled={disabled || loading}
              className="flex-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#502cef] focus:ring-[#502cef] sm:text-sm disabled:bg-gray-50 disabled:text-gray-500"
            />
            
            <button
              type="submit"
              disabled={disabled || loading || !code.trim()}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-[#502cef] hover:bg-[#3d1fb8] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#502cef] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Validating...
                </>
              ) : (
                'Apply'
              )}
            </button>
          </div>
        </div>

        {error && (
          <div className="flex items-center space-x-2 text-red-600">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm">{error}</p>
          </div>
        )}
      </form>

      <div className="mt-3 text-xs text-gray-500">
        <p>Enter a valid promo code to receive a discount on your purchase.</p>
      </div>
    </div>
  )
}

