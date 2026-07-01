import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { Package, ChevronRight, Clock, Truck, CheckCircle } from 'lucide-react';

interface Order {
  id: string;
  status: string;
  total_amount: number;
  created_at: string;
  payment_status: string;
  shipping_address: any;
  items: {
    id: string;
    product_name: string;
    product_image: string | null;
    quantity: number;
    price: number;
  }[];
}

export default function OrdersPage() {
  const { user, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchOrders();
    }
  }, [user]);

  async function fetchOrders() {
    const { data } = await supabase
      .from('orders')
      .select(`
        *,
        items:order_items (*)
      `)
      .eq('user_id', user!.id)
      .order('created_at', { ascending: false });

    if (data) {
      setOrders(data as Order[]);
    }
    setLoading(false);
  }

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  const statusConfig: Record<string, { color: string; icon: any; label: string }> = {
    pending: { color: 'text-warning-600', icon: Clock, label: 'Pending' },
    paid: { color: 'text-primary-600', icon: CheckCircle, label: 'Paid' },
    processing: { color: 'text-primary-600', icon: Clock, label: 'Processing' },
    shipped: { color: 'text-primary-600', icon: Truck, label: 'Shipped' },
    delivered: { color: 'text-success-600', icon: CheckCircle, label: 'Delivered' },
    cancelled: { color: 'text-error-600', icon: X, label: 'Cancelled' },
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link to="/" className="hover:text-gray-900">Home</Link>
        <ChevronRight className="w-4 h-4" />
        <span className="text-gray-900 font-medium">Orders</span>
      </div>

      <h1 className="text-2xl font-bold text-gray-900 mb-8">My Orders</h1>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading...</div>
      ) : orders.length === 0 ? (
        <div className="card p-12 text-center">
          <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No orders yet</h3>
          <p className="text-gray-500 mb-6">
            Start shopping to see your orders here.
          </p>
          <Link to="/products" className="btn-primary btn-md">
            Browse Products
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const config = statusConfig[order.status] || statusConfig.pending;
            const StatusIcon = config.icon;

            return (
              <div key={order.id} className="card">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-4">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      order.status === 'delivered' ? 'bg-success-100' :
                      order.status === 'shipped' ? 'bg-primary-100' :
                      'bg-gray-100'
                    }`}>
                      <StatusIcon className={`w-6 h-6 ${config.color}`} />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        Order #{order.id.slice(0, 8).toUpperCase()}
                      </p>
                      <p className="text-sm text-gray-500">
                        {new Date(order.created_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <span className={`badge ${
                      order.status === 'delivered' ? 'badge-success' :
                      order.status === 'shipped' ? 'badge-primary' :
                      order.status === 'cancelled' ? 'badge-error' :
                      'badge-warning'
                    }`}>
                      {config.label}
                    </span>
                    <span className="text-lg font-semibold text-gray-900">
                      ${order.total_amount.toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className="border-t px-4 py-3">
                  <div className="flex gap-2 overflow-x-auto">
                    {order.items?.map((item) => (
                      <div
                        key={item.id}
                        className="flex-shrink-0 w-16 h-16 bg-gray-100 rounded-md overflow-hidden"
                      >
                        {item.product_image ? (
                          <img
                            src={item.product_image}
                            alt={item.product_name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="w-6 h-6 text-gray-300" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function X({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}
