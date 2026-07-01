import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import type { Product } from '../../types';
import {
  Plus,
  Edit,
  Trash2,
  Eye,
  MoreVertical,
  Search,
  Filter,
} from 'lucide-react';

export default function VendorProducts() {
  const { user, profile, loading: authLoading } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<string>('all');

  useEffect(() => {
    if (user && profile?.role === 'vendor') {
      fetchProducts();
    }
  }, [user, profile, search, status]);

  async function fetchProducts() {
    if (!user) return;

    let query = supabase
      .from('products')
      .select(`
        *,
        category:categories (*),
        images:product_images (*),
        reviews (*)
      `)
      .eq('vendor_id', user.id)
      .order('created_at', { ascending: false });

    if (search) {
      query = query.ilike('name', `%${search}%`);
    }

    if (status !== 'all') {
      query = query.eq('status', status);
    }

    const { data } = await query;
    if (data) setProducts(data);
    setLoading(false);
  }

  async function deleteProduct(id: string) {
    if (!confirm('Are you sure you want to delete this product?')) return;

    await supabase.from('products').delete().eq('id', id);
    setProducts(products.filter((p) => p.id !== id));
  }

  async function toggleStatus(product: Product) {
    const newStatus = product.status === 'active' ? 'draft' : 'active';
    const { error } = await supabase
      .from('products')
      .update({ status: newStatus })
      .eq('id', product.id);

    if (!error) {
      setProducts(
        products.map((p) =>
          p.id === product.id ? { ...p, status: newStatus } : p
        )
      );
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Products</h1>
          <p className="text-gray-600 mt-1">
            Manage your product catalog ({products.length} products)
          </p>
        </div>
        <Link to="/vendor/products/new" className="btn-primary btn-md">
          <Plus className="w-4 h-4 mr-2" />
          Add Product
        </Link>
      </div>

      {/* Filters */}
      <div className="card p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input pl-10"
            />
          </div>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="input md:w-48"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="draft">Draft</option>
            <option value="archived">Archived</option>
          </select>
        </div>
      </div>

      {/* Products Table */}
      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading...</div>
      ) : products.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Filter className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No products found
          </h3>
          <p className="text-gray-500 mb-6">
            {search || status !== 'all'
              ? 'Try adjusting your filters'
              : 'Add your first product to start selling'}
          </p>
          <Link to="/vendor/products/new" className="btn-primary btn-md">
            Add Product
          </Link>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stock
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {products.map((product) => {
                  const mainImage = product.images?.[0]?.url;
                  const avgRating = product.reviews?.length
                    ? (
                        product.reviews.reduce((sum, r) => sum + r.rating, 0) /
                        product.reviews.length
                      ).toFixed(1)
                    : null;

                  return (
                    <tr key={product.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                            {mainImage ? (
                              <img
                                src={mainImage}
                                alt={product.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-400">
                                <Filter className="w-6 h-6" />
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 line-clamp-1">
                              {product.name}
                            </p>
                            {avgRating && (
                              <p className="text-sm text-gray-500">
                                {avgRating} rating
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {product.category?.name || '-'}
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-medium text-gray-900">
                          ${product.price.toFixed(2)}
                        </p>
                        {product.compare_price && (
                          <p className="text-sm text-gray-400 line-through">
                            ${product.compare_price.toFixed(2)}
                          </p>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={
                            product.stock_quantity === 0
                              ? 'text-error-600'
                              : product.stock_quantity < 10
                              ? 'text-warning-600'
                              : 'text-gray-600'
                          }
                        >
                          {product.stock_quantity}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => toggleStatus(product)}
                          className={`badge cursor-pointer ${
                            product.status === 'active'
                              ? 'badge-success'
                              : product.status === 'draft'
                              ? 'badge-secondary'
                              : 'badge-warning'
                          }`}
                        >
                          {product.status}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            to={`/products/${product.slug}`}
                            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                          <Link
                            to={`/vendor/products/${product.id}/edit`}
                            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                          >
                            <Edit className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => deleteProduct(product.id)}
                            className="p-2 text-gray-400 hover:text-error-600 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
