import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import type { Product, Category } from '../types';
import ProductCard from '../components/ProductCard';
import { Filter, ChevronDown, X, Grid, List } from 'lucide-react';

export default function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  const search = searchParams.get('search') || '';
  const category = searchParams.get('category') || '';
  const sortBy = searchParams.get('sort') || 'newest';
  const priceMin = searchParams.get('priceMin') || '';
  const priceMax = searchParams.get('priceMax') || '';
  const featured = searchParams.get('featured') === 'true';

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, [search, category, sortBy, priceMin, priceMax, featured]);

  async function fetchCategories() {
    const { data } = await supabase.from('categories').select('*').order('name');
    if (data) setCategories(data);
  }

  async function fetchProducts() {
    setLoading(true);

    let query = supabase
      .from('products')
      .select(`
        *,
        vendor:profiles (*),
        images:product_images (*),
        category:categories (*),
        reviews (*)
      `)
      .eq('status', 'active');

    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
    }

    if (category) {
      query = query.eq('category_id', category);
    }

    if (featured) {
      query = query.eq('featured', true);
    }

    if (priceMin) {
      query = query.gte('price', parseFloat(priceMin));
    }

    if (priceMax) {
      query = query.lte('price', parseFloat(priceMax));
    }

    switch (sortBy) {
      case 'price-low':
        query = query.order('price', { ascending: true });
        break;
      case 'price-high':
        query = query.order('price', { ascending: false });
        break;
      case 'popular':
        // Sort by number of reviews
        break;
      default:
        query = query.order('created_at', { ascending: false });
    }

    const { data } = await query.limit(24);

    if (data) {
      if (sortBy === 'popular') {
        data.sort((a, b) => (b.reviews?.length || 0) - (a.reviews?.length || 0));
      }
      setProducts(data);
    }

    setLoading(false);
  }

  function updateFilter(key: string, value: string) {
    const params = new URLSearchParams(searchParams);
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    setSearchParams(params);
  }

  function clearFilters() {
    setSearchParams({});
  }

  const activeFilters = [
    search && { key: 'search', label: `Search: "${search}"` },
    category && { key: 'category', label: `Category: ${categories.find(c => c.id === category)?.name || category}` },
    featured && { key: 'featured', label: 'Featured Only' },
    priceMin && { key: 'priceMin', label: `Min: $${priceMin}` },
    priceMax && { key: 'priceMax', label: `Max: $${priceMax}` },
  ].filter(Boolean);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {featured ? 'Featured Products' : search ? `Search: "${search}"` : 'All Products'}
          </h1>
          <p className="text-gray-600 mt-1">
            {!loading && `${products.length} products found`}
          </p>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 md:hidden"
          >
            <Filter className="w-4 h-4" />
            Filters
          </button>

          <select
            value={sortBy}
            onChange={(e) => updateFilter('sort', e.target.value)}
            className="px-4 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="newest">Newest</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
            <option value="popular">Most Popular</option>
          </select>
        </div>
      </div>

      {/* Active Filters */}
      {activeFilters.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6">
          {activeFilters.map((filter) => (
            <span
              key={filter!.key}
              className="inline-flex items-center gap-1 px-3 py-1 bg-primary-50 text-primary-700 text-sm rounded-full"
            >
              {filter!.label}
              <button
                onClick={() => updateFilter(filter!.key, '')}
                className="hover:bg-primary-100 rounded-full p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
          <button
            onClick={clearFilters}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Clear all
          </button>
        </div>
      )}

      <div className="flex gap-8">
        {/* Sidebar Filters - Desktop */}
        <aside className="hidden md:block w-64 flex-shrink-0">
          <div className="sticky top-24 space-y-6">
            <div className="card p-4">
              <h3 className="font-semibold text-gray-900 mb-4">Categories</h3>
              <div className="space-y-2">
                <button
                  onClick={() => updateFilter('category', '')}
                  className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                    !category ? 'bg-primary-50 text-primary-700' : 'hover:bg-gray-50'
                  }`}
                >
                  All Categories
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => updateFilter('category', cat.id)}
                    className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                      category === cat.id
                        ? 'bg-primary-50 text-primary-700'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="card p-4">
              <h3 className="font-semibold text-gray-900 mb-4">Price Range</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-gray-600">Min Price</label>
                  <input
                    type="number"
                    value={priceMin}
                    onChange={(e) => updateFilter('priceMin', e.target.value)}
                    placeholder="$0"
                    className="input mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-600">Max Price</label>
                  <input
                    type="number"
                    value={priceMax}
                    onChange={(e) => updateFilter('priceMax', e.target.value)}
                    placeholder="$1000"
                    className="input mt-1"
                  />
                </div>
              </div>
            </div>

            <div className="card p-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={featured}
                  onChange={(e) => updateFilter('featured', e.target.checked ? 'true' : '')}
                  className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="font-medium text-gray-900">Featured Only</span>
              </label>
            </div>
          </div>
        </aside>

        {/* Mobile Filters Modal */}
        {showFilters && (
          <div className="fixed inset-0 z-50 md:hidden">
            <div className="absolute inset-0 bg-black/50" onClick={() => setShowFilters(false)} />
            <div className="absolute inset-y-0 left-0 w-80 max-w-full bg-white overflow-y-auto">
              <div className="flex items-center justify-between p-4 border-b">
                <h2 className="font-semibold text-lg">Filters</h2>
                <button onClick={() => setShowFilters(false)}>
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-4 space-y-6">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-4">Categories</h3>
                  <div className="space-y-2">
                    <button
                      onClick={() => {
                        updateFilter('category', '');
                        setShowFilters(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                        !category ? 'bg-primary-50 text-primary-700' : 'hover:bg-gray-50'
                      }`}
                    >
                      All Categories
                    </button>
                    {categories.map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => {
                          updateFilter('category', cat.id);
                          setShowFilters(false);
                        }}
                        className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                          category === cat.id
                            ? 'bg-primary-50 text-primary-700'
                            : 'hover:bg-gray-50'
                        }`}
                      >
                        {cat.name}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-4">Price Range</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm text-gray-600">Min Price</label>
                      <input
                        type="number"
                        value={priceMin}
                        onChange={(e) => updateFilter('priceMin', e.target.value)}
                        placeholder="$0"
                        className="input mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-gray-600">Max Price</label>
                      <input
                        type="number"
                        value={priceMax}
                        onChange={(e) => updateFilter('priceMax', e.target.value)}
                        placeholder="$1000"
                        className="input mt-1"
                      />
                    </div>
                  </div>
                </div>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={featured}
                    onChange={(e) => updateFilter('featured', e.target.checked ? 'true' : '')}
                    className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="font-medium text-gray-900">Featured Only</span>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Product Grid */}
        <div className="flex-1">
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              {[...Array(9)].map((_, i) => (
                <div key={i} className="card p-4 animate-pulse">
                  <div className="aspect-square bg-gray-200 rounded-lg mb-4" />
                  <div className="h-4 bg-gray-200 rounded mb-2" />
                  <div className="h-3 bg-gray-200 rounded w-2/3" />
                </div>
              ))}
            </div>
          ) : products.length > 0 ? (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Filter className="w-12 h-12 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No products found</h3>
              <p className="text-gray-500 mb-4">
                Try adjusting your filters or search terms
              </p>
              <button
                onClick={clearFilters}
                className="btn-primary btn-md"
              >
                Clear Filters
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
