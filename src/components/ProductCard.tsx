import { Link } from 'react-router-dom';
import type { Product } from '../types';
import { Star, ShoppingBag } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useState } from 'react';

interface Props {
  product: Product;
}

export default function ProductCard({ product }: Props) {
  const { addItem } = useCart();
  const [adding, setAdding] = useState(false);

  const mainImage = product.images?.[0]?.url || 'https://images.pexels.com/photos/90946/pexels-photo-90946.jpeg?auto=compress&cs=tinysrgb&w=400';
  const averageRating = product.reviews?.length
    ? (product.reviews.reduce((sum, r) => sum + r.rating, 0) / product.reviews.length).toFixed(1)
    : null;

  const discount = product.compare_price
    ? Math.round(((product.compare_price - product.price) / product.compare_price) * 100)
    : null;

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setAdding(true);
    await addItem(product, 1);
    setAdding(false);
  };

  return (
    <Link to={`/products/${product.slug}`} className="group">
      <div className="card overflow-hidden hover:shadow-md transition-shadow">
        <div className="relative aspect-square bg-gray-100">
          <img
            src={mainImage}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          {discount && (
            <span className="absolute top-2 left-2 bg-error-500 text-white text-xs font-semibold px-2 py-1 rounded">
              -{discount}%
            </span>
          )}
          {product.stock_quantity === 0 && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <span className="bg-white text-gray-900 font-semibold px-4 py-2 rounded">
                Out of Stock
              </span>
            </div>
          )}
          <button
            onClick={handleAddToCart}
            disabled={product.stock_quantity === 0 || adding}
            className="absolute bottom-2 right-2 bg-white/90 hover:bg-white text-gray-900 p-2 rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ShoppingBag className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4">
          {product.category && (
            <p className="text-xs text-gray-500 mb-1">{product.category.name}</p>
          )}
          <h3 className="font-semibold text-gray-900 line-clamp-2 mb-1">
            {product.name}
          </h3>

          {product.vendor && (
            <p className="text-xs text-gray-500 mb-2">
              by {product.vendor.store_name || product.vendor.full_name}
            </p>
          )}

          <div className="flex items-center gap-2 mb-2">
            {averageRating && (
              <>
                <div className="flex items-center">
                  <Star className="w-4 h-4 text-warning-400 fill-warning-400" />
                  <span className="text-sm font-medium ml-1">{averageRating}</span>
                </div>
                <span className="text-gray-300">|</span>
              </>
            )}
            <span className="text-xs text-gray-500">
              {product.stock_quantity > 0
                ? `${product.stock_quantity} in stock`
                : 'Out of stock'}
            </span>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-lg font-bold text-gray-900">
              ${product.price.toFixed(2)}
            </span>
            {product.compare_price && (
              <span className="text-sm text-gray-400 line-through">
                ${product.compare_price.toFixed(2)}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
