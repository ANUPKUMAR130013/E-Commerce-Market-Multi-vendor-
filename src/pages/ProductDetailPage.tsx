import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import type { Product, Review } from '../types';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import {
  Star,
  ShoppingBag,
  Heart,
  Share2,
  ChevronRight,
  Truck,
  ShieldCheck,
  RotateCcw,
  Minus,
  Plus,
  Store,
  Check,
} from 'lucide-react';

export default function ProductDetailPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { addItem } = useCart();
  const { user } = useAuth();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    if (slug) {
      fetchProduct();
    }
  }, [slug]);

  async function fetchProduct() {
    const { data } = await supabase
      .from('products')
      .select(`
        *,
        vendor:profiles (*),
        images:product_images (*),
        category:categories (*),
        reviews (
          *,
          user:profiles (*)
        )
      `)
      .eq('slug', slug)
      .maybeSingle();

    if (data) {
      setProduct(data);
    }
    setLoading(false);
  }

  async function handleAddToCart() {
    if (!product || !user) {
      if (!user) navigate('/login');
      return;
    }
    setAdding(true);
    await addItem(product, quantity);
    setAdding(false);
  }

  async function submitReview() {
    if (!product || !user || !reviewComment.trim()) return;

    setSubmittingReview(true);
    const { error } = await supabase.from('reviews').insert({
      product_id: product.id,
      user_id: user.id,
      rating: reviewRating,
      comment: reviewComment.trim(),
    });

    if (!error) {
      setShowReviewForm(false);
      setReviewComment('');
      setReviewRating(5);
      fetchProduct();
    }
    setSubmittingReview(false);
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid md:grid-cols-2 gap-8">
          <div className="aspect-square bg-gray-200 rounded-lg animate-pulse" />
          <div className="space-y-4">
            <div className="h-8 bg-gray-200 rounded w-3/4 animate-pulse" />
            <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse" />
            <div className="h-6 bg-gray-200 rounded w-1/3 animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Product not found</h1>
        <Link to="/products" className="text-primary-600 hover:underline">
          Browse all products
        </Link>
      </div>
    );
  }

  const mainImage = product.images?.[selectedImage]?.url || 'https://images.pexels.com/photos/90946/pexels-photo-90946.jpeg?auto=compress&cs=tinysrgb&w=800';
  const averageRating = product.reviews?.length
    ? (product.reviews.reduce((sum, r) => sum + r.rating, 0) / product.reviews.length).toFixed(1)
    : null;

  const discount = product.compare_price
    ? Math.round(((product.compare_price - product.price) / product.compare_price) * 100)
    : null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link to="/" className="hover:text-gray-900">Home</Link>
        <ChevronRight className="w-4 h-4" />
        <Link to="/products" className="hover:text-gray-900">Products</Link>
        {product.category && (
          <>
            <ChevronRight className="w-4 h-4" />
            <Link
              to={`/products?category=${product.category.id}`}
              className="hover:text-gray-900"
            >
              {product.category.name}
            </Link>
          </>
        )}
        <ChevronRight className="w-4 h-4" />
        <span className="text-gray-900 font-medium truncate">{product.name}</span>
      </nav>

      <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
        {/* Image Gallery */}
        <div className="space-y-4">
          <div className="relative aspect-square bg-gray-100 rounded-xl overflow-hidden">
            <img
              src={mainImage}
              alt={product.name}
              className="w-full h-full object-cover"
            />
            {discount && (
              <span className="absolute top-4 left-4 bg-error-500 text-white text-sm font-semibold px-3 py-1 rounded-lg">
                -{discount}% OFF
              </span>
            )}
          </div>

          {product.images && product.images.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-2">
              {product.images.map((image, index) => (
                <button
                  key={image.id}
                  onClick={() => setSelectedImage(index)}
                  className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-colors ${
                    selectedImage === index
                      ? 'border-primary-600'
                      : 'border-transparent hover:border-gray-300'
                  }`}
                >
                  <img
                    src={image.url}
                    alt={image.alt_text || product.name}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="space-y-6">
          <div>
            {product.category && (
              <Link
                to={`/products?category=${product.category.id}`}
                className="text-sm text-primary-600 hover:text-primary-700 font-medium"
              >
                {product.category.name}
              </Link>
            )}
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mt-2">
              {product.name}
            </h1>

            <div className="flex items-center gap-4 mt-3">
              {averageRating && (
                <div className="flex items-center gap-1">
                  <Star className="w-5 h-5 text-warning-400 fill-warning-400" />
                  <span className="font-medium">{averageRating}</span>
                  <span className="text-gray-500">
                    ({product.reviews?.length} reviews)
                  </span>
                </div>
              )}
              <span className="text-gray-300">|</span>
              <span className="text-gray-500">
                {product.stock_quantity > 0
                  ? `${product.stock_quantity} in stock`
                  : 'Out of stock'}
              </span>
            </div>
          </div>

          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-bold text-gray-900">
              ${product.price.toFixed(2)}
            </span>
            {product.compare_price && (
              <>
                <span className="text-xl text-gray-400 line-through">
                  ${product.compare_price.toFixed(2)}
                </span>
                <span className="text-success-600 font-semibold">
                  Save ${(product.compare_price - product.price).toFixed(2)}
                </span>
              </>
            )}
          </div>

          {product.description && (
            <p className="text-gray-600 leading-relaxed">{product.description}</p>
          )}

          {/* Vendor Info */}
          {product.vendor && (
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
              <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                <Store className="w-6 h-6 text-primary-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Sold by</p>
                <Link
                  to={`/vendor/${product.vendor.id}`}
                  className="font-semibold text-gray-900 hover:text-primary-600"
                >
                  {product.vendor.store_name || product.vendor.full_name || 'Vendor'}
                </Link>
              </div>
            </div>
          )}

          {/* Quantity & Add to Cart */}
          <div className="flex items-center gap-4">
            <div className="flex items-center border border-gray-300 rounded-lg">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="p-3 hover:bg-gray-100 disabled:opacity-50"
                disabled={quantity <= 1}
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="px-4 font-medium">{quantity}</span>
              <button
                onClick={() => setQuantity(Math.min(product.stock_quantity, quantity + 1))}
                className="p-3 hover:bg-gray-100 disabled:opacity-50"
                disabled={quantity >= product.stock_quantity}
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={handleAddToCart}
              disabled={product.stock_quantity === 0 || adding}
              className="flex-1 btn-primary btn-lg"
            >
              {adding ? (
                'Adding...'
              ) : (
                <>
                  <ShoppingBag className="w-5 h-5 mr-2" />
                  Add to Cart
                </>
              )}
            </button>
          </div>

          {/* Trust Badges */}
          <div className="grid grid-cols-3 gap-4 pt-4 border-t">
            <div className="flex items-center gap-2 text-sm">
              <Truck className="w-5 h-5 text-gray-400" />
              <span className="text-gray-600">Free shipping</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <ShieldCheck className="w-5 h-5 text-gray-400" />
              <span className="text-gray-600">Secure payment</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <RotateCcw className="w-5 h-5 text-gray-400" />
              <span className="text-gray-600">30-day returns</span>
            </div>
          </div>
        </div>
      </div>

      {/* Reviews Section */}
      <section className="mt-16">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-gray-900">
            Customer Reviews
            {product.reviews && ` (${product.reviews.length})`}
          </h2>
          {user && !product.reviews?.some((r) => r.user_id === user.id) && (
            <button
              onClick={() => setShowReviewForm(!showReviewForm)}
              className="btn-secondary btn-md"
            >
              Write a Review
            </button>
          )}
        </div>

        {/* Review Form */}
        {showReviewForm && (
          <div className="card p-6 mb-8">
            <h3 className="font-semibold text-lg mb-4">Write a Review</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rating
                </label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <button
                      key={rating}
                      onClick={() => setReviewRating(rating)}
                      className="p-1"
                    >
                      <Star
                        className={`w-6 h-6 ${
                          rating <= reviewRating
                            ? 'text-warning-400 fill-warning-400'
                            : 'text-gray-300'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Review
                </label>
                <textarea
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  rows={4}
                  placeholder="Share your experience with this product..."
                  className="input resize-none"
                />
              </div>
              <button
                onClick={submitReview}
                disabled={!reviewComment.trim() || submittingReview}
                className="btn-primary btn-md"
              >
                {submittingReview ? 'Submitting...' : 'Submit Review'}
              </button>
            </div>
          </div>
        )}

        {/* Reviews List */}
        {product.reviews && product.reviews.length > 0 ? (
          <div className="space-y-6">
            {product.reviews.map((review) => (
              <div key={review.id} className="card p-6">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                      <span className="font-medium text-gray-600">
                        {(review as any).user?.full_name?.[0]?.toUpperCase() || 'U'}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {(review as any).user?.full_name || 'Anonymous'}
                      </p>
                      <p className="text-sm text-gray-500">
                        {new Date(review.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${
                          i < review.rating
                            ? 'text-warning-400 fill-warning-400'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                </div>
                {review.comment && (
                  <p className="text-gray-600">{review.comment}</p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <p>No reviews yet. Be the first to review this product!</p>
          </div>
        )}
      </section>
    </div>
  );
}
