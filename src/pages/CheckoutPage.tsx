import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import type { ShippingAddress } from '../types';
import { Lock, Check, CreditCard, ChevronRight } from 'lucide-react';

export default function CheckoutPage() {
  const { items, subtotal, clearCart } = useCart();
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState<'address' | 'payment' | 'confirmation'>('address');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [address, setAddress] = useState<ShippingAddress>({
    full_name: profile?.full_name || '',
    address_line1: '',
    address_line2: '',
    city: '',
    state: '',
    postal_code: '',
    country: 'United States',
    phone: '',
  });

  const shipping = subtotal >= 50 ? 0 : 4.99;
  const tax = subtotal * 0.08;
  const total = subtotal + shipping + tax;

  const handleAddressChange = (field: keyof ShippingAddress, value: string) => {
    setAddress((prev) => ({ ...prev, [field]: value }));
  };

  const validateAddress = () => {
    return (
      address.full_name &&
      address.address_line1 &&
      address.city &&
      address.state &&
      address.postal_code &&
      address.phone
    );
  };

  const handleSubmitOrder = async () => {
    if (!user || items.length === 0) return;

    setLoading(true);
    setError('');

    try {
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user.id,
          status: 'paid',
          total_amount: total,
          shipping_address: address as any,
          payment_status: 'paid',
          payment_id: `PAY-${Date.now()}`,
        })
        .select()
        .maybeSingle();

      if (orderError ?? !order) {
        throw new Error('Failed to create order');
      }

      const orderItems = items.map((item) => ({
        order_id: order.id,
        product_id: item.product_id,
        vendor_id: item.product?.vendor_id || '',
        product_name: item.product?.name || '',
        product_image: item.product?.images?.[0]?.url || null,
        quantity: item.quantity,
        price: item.product?.price || 0,
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) {
        throw new Error('Failed to add order items');
      }

      await clearCart();
      setStep('confirmation');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to place order');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    navigate('/login');
    return null;
  }

  if (items.length === 0 && step !== 'confirmation') {
    navigate('/cart');
    return null;
  }

  if (step === 'confirmation') {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <div className="w-20 h-20 bg-success-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <Check className="w-10 h-10 text-success-600" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Order Confirmed!</h1>
        <p className="text-gray-600 mb-8">
          Thank you for your purchase. You will receive an email confirmation shortly.
        </p>
        <button
          onClick={() => navigate('/orders')}
          className="btn-primary btn-lg"
        >
          View Orders
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Progress Steps */}
      <div className="flex items-center justify-center mb-8">
        <div className="flex items-center">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-medium ${
            step === 'address' ? 'bg-primary-600 text-white' : 'bg-success-500 text-white'
          }`}>
            {step !== 'address' ? <Check className="w-5 h-5" /> : '1'}
          </div>
          <span className="ml-2 font-medium text-gray-900">Address</span>
        </div>
        <div className="w-16 h-0.5 bg-gray-300 mx-4" />
        <div className="flex items-center">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-medium ${
            step === 'payment' ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-500'
          }`}>
            2
          </div>
          <span className="ml-2 font-medium text-gray-900">Payment</span>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          {error && (
            <div className="bg-error-50 border border-error-200 text-error-700 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          {step === 'address' && (
            <div className="card p-6">
              <h2 className="text-xl font-semibold mb-6">Shipping Address</h2>

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={address.full_name}
                    onChange={(e) => handleAddressChange('full_name', e.target.value)}
                    className="input"
                    required
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Address Line 1 *
                  </label>
                  <input
                    type="text"
                    value={address.address_line1}
                    onChange={(e) => handleAddressChange('address_line1', e.target.value)}
                    placeholder="Street address"
                    className="input"
                    required
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Address Line 2
                  </label>
                  <input
                    type="text"
                    value={address.address_line2}
                    onChange={(e) => handleAddressChange('address_line2', e.target.value)}
                    placeholder="Apartment, suite, etc. (optional)"
                    className="input"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    City *
                  </label>
                  <input
                    type="text"
                    value={address.city}
                    onChange={(e) => handleAddressChange('city', e.target.value)}
                    className="input"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    State *
                  </label>
                  <input
                    type="text"
                    value={address.state}
                    onChange={(e) => handleAddressChange('state', e.target.value)}
                    className="input"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ZIP Code *
                  </label>
                  <input
                    type="text"
                    value={address.postal_code}
                    onChange={(e) => handleAddressChange('postal_code', e.target.value)}
                    className="input"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone *
                  </label>
                  <input
                    type="tel"
                    value={address.phone}
                    onChange={(e) => handleAddressChange('phone', e.target.value)}
                    className="input"
                    required
                  />
                </div>
              </div>

              <button
                onClick={() => setStep('payment')}
                disabled={!validateAddress()}
                className="w-full btn-primary btn-lg mt-6"
              >
                Continue to Payment
              </button>
            </div>
          )}

          {step === 'payment' && (
            <div className="card p-6">
              <h2 className="text-xl font-semibold mb-6">Payment Method</h2>

              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
                <div className="flex items-center gap-3">
                  <CreditCard className="w-6 h-6 text-gray-400" />
                  <div>
                    <p className="font-medium text-gray-900">Credit Card</p>
                    <p className="text-sm text-gray-500">Pay with your credit card</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Card Number
                  </label>
                  <input
                    type="text"
                    placeholder="1234 5678 9012 3456"
                    className="input"
                    defaultValue="4242 4242 4242 4242"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Expiry Date
                    </label>
                    <input
                      type="text"
                      placeholder="MM/YY"
                      className="input"
                      defaultValue="12/28"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      CVV
                    </label>
                    <input
                      type="text"
                      placeholder="123"
                      className="input"
                      defaultValue="123"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-4 mt-6">
                <button
                  onClick={() => setStep('address')}
                  className="btn-secondary btn-lg flex-1"
                >
                  Back
                </button>
                <button
                  onClick={handleSubmitOrder}
                  disabled={loading}
                  className="btn-primary btn-lg flex-1"
                >
                  {loading ? 'Processing...' : 'Place Order'}
                </button>
              </div>

              <div className="flex items-center justify-center gap-2 text-sm text-gray-500 mt-4">
                <Lock className="w-4 h-4" />
                <span>Your payment information is secure</span>
              </div>
            </div>
          )}
        </div>

        <div className="lg:col-span-1">
          <div className="card p-6 sticky top-24">
            <h2 className="text-lg font-semibold mb-4">Order Summary</h2>

            <div className="space-y-3 mb-4">
              {items.map((item) => (
                <div key={item.id} className="flex gap-3">
                  <div className="w-16 h-16 bg-gray-100 rounded-md flex-shrink-0 overflow-hidden">
                    <img
                      src={item.product?.images?.[0]?.url || 'https://images.pexels.com/photos/90946/pexels-photo-90946.jpeg?auto=compress&cs=tinysrgb&w=100'}
                      alt={item.product?.name || 'Product'}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {item.product?.name}
                    </p>
                    <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                  </div>
                  <p className="text-sm font-medium">
                    ${((item.product?.price || 0) * item.quantity).toFixed(2)}
                  </p>
                </div>
              ))}
            </div>

            <hr />

            <div className="space-y-3 my-4">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Shipping</span>
                <span>{shipping === 0 ? 'Free' : `$${shipping.toFixed(2)}`}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Tax</span>
                <span>${tax.toFixed(2)}</span>
              </div>
              <hr />
              <div className="flex justify-between font-semibold text-lg">
                <span>Total</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
