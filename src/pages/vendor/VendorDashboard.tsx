import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import {
  Package,
  DollarSign,
  ShoppingCart,
  Star,
  TrendingUp,
  ArrowRight,
  Plus,
} from 'lucide-react';

interface Stats {
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
  avgRating: number;
  pendingOrders: number;
}

export default function VendorDashboard() {
  const { user, profile, loading: authLoading } = useAuth();
  const [stats, setStats] = useState<Stats>({
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
    avgRating: 0,
    pendingOrders: 0,
  });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && profile?.role === 'vendor') {
      fetchDashboardData();
    }
  }, [user, profile]);

  async function fetchDashboardData() {
    if (!user) return;

    const [productsRes, ordersRes] = await Promise.all([
      supabase
        .from('products')
        .select('id, name, price, stock_quantity, reviews(*)')
        .eq('vendor_id', user.id),
      supabase
        .from('order_items')
        .select(`
          *,
          order:orders (*)
        `)
        .eq('vendor_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10),
    ]);

    const products = productsRes.data || [];
    const orderItems = ordersRes.data || [];

    let totalRevenue = 0;
    let avgRating = 0;
    let totalReviews = 0;

    products.forEach((p: any) => {
      if (p.reviews) {
        p.reviews.forEach((r: any) => {
          avgRating += r.rating;
          totalReviews++;
        });
      }
    });

    const uniqueOrders = new Map();
    orderItems.forEach((item: any) => {
      totalRevenue += item.price * item.quantity;
      if (item.order && !uniqueOrders.has(item.order.id)) {
        uniqueOrders.set(item.order.id, item.order);
      }
    });

    setStats({
      totalProducts: products.length,
      totalOrders: uniqueOrders.size,
      totalRevenue,
      avgRating: totalReviews > 0 ? avgRating / totalReviews : 0,
      pendingOrders: Array.from(uniqueOrders.values()).filter(
        (o: any) => o.status === 'paid' || o.status === 'processing'
      ).length,
    });

    setRecentOrders(orderItems.slice(0, 5));
    setLoading(false);
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Vendor Dashboard</h1>
          <p className="text-gray-600 mt-1">Welcome back, {profile?.full_name}</p>
        </div>
        <Link to="/vendor/products/new" className="btn-primary btn-md">
          <Plus className="w-4 h-4 mr-2" />
          Add Product
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="card p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
              <Package className="w-6 h-6 text-primary-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Products</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalProducts}</p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-success-100 rounded-lg flex items-center justify-center">
              <ShoppingCart className="w-6 h-6 text-success-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Orders</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalOrders}</p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-warning-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-warning-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Revenue</p>
              <p className="text-2xl font-bold text-gray-900">
                ${stats.totalRevenue.toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-error-100 rounded-lg flex items-center justify-center">
              <Star className="w-6 h-6 text-error-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Rating</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.avgRating > 0 ? stats.avgRating.toFixed(1) : '-'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Recent Orders */}
        <div className="lg:col-span-2">
          <div className="card">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="font-semibold text-gray-900">Recent Orders</h2>
              <Link to="/vendor/orders" className="text-primary-600 text-sm hover:underline">
                View All
              </Link>
            </div>

            {loading ? (
              <div className="p-8 text-center text-gray-500">Loading...</div>
            ) : recentOrders.length > 0 ? (
              <div className="divide-y">
                {recentOrders.map((item: any) => (
                  <div key={item.id} className="p-4 flex items-center gap-4">
                    <div className="w-12 h-12 bg-gray-100 rounded-lg flex-shrink-0 overflow-hidden">
                      {item.product_image && (
                        <img
                          src={item.product_image}
                          alt={item.product_name}
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">
                        {item.product_name}
                      </p>
                      <p className="text-sm text-gray-500">
                        Qty: {item.quantity} x ${item.price.toFixed(2)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900">
                        ${(item.price * item.quantity).toFixed(2)}
                      </p>
                      <span className={`badge ${
                        item.order?.status === 'delivered' ? 'badge-success' :
                        item.order?.status === 'shipped' ? 'badge-primary' :
                        'badge-warning'
                      }`}>
                        {item.order?.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-gray-500">
                <Package className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>No orders yet</p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="lg:col-span-1">
          <div className="card p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Quick Actions</h2>
            <div className="space-y-3">
              <Link
                to="/vendor/products"
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <span className="font-medium text-gray-700">Manage Products</span>
                <ArrowRight className="w-4 h-4 text-gray-400" />
              </Link>
              <Link
                to="/vendor/orders"
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <span className="font-medium text-gray-700">View Orders</span>
                <ArrowRight className="w-4 h-4 text-gray-400" />
              </Link>
              <Link
                to="/vendor/settings"
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <span className="font-medium text-gray-700">Store Settings</span>
                <ArrowRight className="w-4 h-4 text-gray-400" />
              </Link>
            </div>
          </div>

          {stats.pendingOrders > 0 && (
            <div className="card p-6 mt-4 bg-warning-50 border-warning-200">
              <p className="text-warning-800 font-medium">
                You have {stats.pendingOrders} pending order(s) to process
              </p>
              <Link
                to="/vendor/orders"
                className="text-warning-700 text-sm hover:underline mt-1 block"
              >
                View orders
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
