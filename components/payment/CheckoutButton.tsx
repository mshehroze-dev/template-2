import { useState } from 'react';

interface CheckoutButtonProps {
  priceId?: string;
  planId?: string;
  children: React.ReactNode;
  disabled?: boolean;
}

export function CheckoutButton({ priceId, planId, children, disabled }: CheckoutButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleCheckout = async () => {
    setLoading(true);
    
    try {
      console.log('Initiating checkout for price:', priceId || planId);
    } catch (error) {
      console.error('Checkout error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleCheckout}
      disabled={loading || disabled}
      className="w-full bg-[#502cef] text-white py-2 px-4 rounded-md hover:bg-[#3d1fb8] disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {loading ? 'Processing...' : children}
    </button>
  );
}

export default CheckoutButton;

