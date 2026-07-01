import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { Package, Eye, ChevronRight } from 'lucide-react';

interface OrderItem {
  id: string;
  order_id: string;
  product_name: string;
  product_image: string | null;
  quantity: number;
  price: number;
  created_at: string;
  order: {
    id: string;
    user_id: string;
    status: string;
    total_amount: number;
    shipping_address: any;
    created_at: string;
  };
}

export default function VendorOrders() {
  const { user, profile, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState<OrderItem[] | null>(null);

  useEffect(() => {
    if (user && profile?.role === 'vendor') {
      fetchOrders();
    }
  }, [user, profile, status]);

  async function fetchOrders() {
    if (!user) return;

    let query = supabase
      .from('order_items')
      .select(`
        *,
        order:orders (*)
      `)
      .eq('vendor_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (status !== 'all') {
      query = query.select(`*, order:orders!inner (*)`).eq('order.status', status);
    }

    const { data } = await query;
    if (data) {
      setOrders(data as OrderItem[]);
    }
    setLoading(false);
  }

  async function updateOrderStatus(orderId: string, newStatus: string) {
    const { error } = await supabase
      .from('orders')
      .update({ status: newStatus })
      .eq('id', orderId);

    if (!error) {
      fetchOrders();
    }
  }

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    );
  }

  if (!user || profile?.role !== 'vendor') {
    return <Navigate to="/vendor/register" />;
  }

  const groupedOrders = orders.reduce((acc, item) => {
    const orderId = item.order_id;
    if (!acc[orderId]) {
      acc[orderId] = [];
    }
    acc[orderId].push(item);
    return acc;
  }, {} as Record<string, OrderItem[]>);

  const orderValues = Object.values(groupedOrders);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
        <p className="text-gray-600 mt-1">
          Manage orders for your products
        </p>
      </div>

      {/* Filters */}
      <div className="card p-4 mb-6">
        <div className="flex gap-2 overflow-x-auto">
          {['all', 'pending', 'paid', 'processing', 'shipped', 'delivered'].map((s) => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                status === s
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Orders List */}
      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading...</div>
      ) : orderValues.length === 0 ? (
        <div className="card p-12 text-center">
          <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No orders found</h3>
          <p className="text-gray-500">
            {status !== 'all'
              ? 'No orders with this status'
              : 'Orders will appear here when customers buy your products'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {orderValues.map((items) => {
            const order = items[0].order;
            const totalAmount = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

            return (
              <div key={order.id} className="card">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 border-b">
                  <div className="flex items-center gap-4">
                    <div>
                      <p className="font-medium text-gray-900">
                        Order #{order.id.slice(0, 8).toUpperCase()}
                      </p>
                      <p className="text-sm text-gray-500">
                        {new Date(order.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <span
                      className={`badge ${
                        order.status === 'delivered'
                          ? 'badge-success'
                          : order.status === 'shipped'
                          ? 'badge-primary'
                          : order.status === 'cancelled'
                          ? 'badge-error'
                          : 'badge-warning'
                      }`}
                    >
                      {order.status}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-lg font-semibold text-gray-900">
                      ${totalAmount.toFixed(2)}
                    </span>
                    <button
                      onClick={() => setSelectedOrder(selectedOrder === items ? null : items)}
                      className="btn-secondary btn-sm"
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      Details
                    </button>
                  </div>
                </div>

                {(selectedOrder === items) && (
                  <div className="p-4 bg-gray-50 animate-fade-in">
                    <h4 className="font-medium text-gray-900 mb-4">Items</h4>
                    <div className="space-y-3">
                      {items.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center gap-4 bg-white p-3 rounded-lg"
                        >
                          <div className="w-16 h-16 bg-gray-100 rounded-md overflow-hidden flex-shrink-0">
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
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">{item.product_name}</p>
                            <p className="text-sm text-gray-500">
                              Qty: {item.quantity} x ${item.price.toFixed(2)}
                            </p>
                          </div>
                          <p className="font-medium text-gray-900">
                            ${(item.price * item.quantity).toFixed(2)}
                          </p>
                        </div>
                      ))}
                    </div>

                    <div className="mt-4 pt-4 border-t">
                      <h4 className="font-medium text-gray-900 mb-4">Actions</h4>
                      <div className="flex flex-wrap gap-2">
                        {order.status === 'paid' && (
                          <button
                            onClick={() => updateOrderStatus(order.id, 'processing')}
                            className="btn-primary btn-sm"
                          >
                            Start Processing
                          </button>
                        )}
                        {order.status === 'processing' && (
                          <button
                            onClick={() => updateOrderStatus(order.id, 'shipped')}
                            className="btn-primary btn-sm"
                          >
                            Mark as Shipped
                          </button>
                        )}
                        {order.status === 'shipped' && (
                          <button
                            onClick={() => updateOrderStatus(order.id, 'delivered')}
                            className="btn-primary btn-sm"
                          >
                            Mark as Delivered
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
