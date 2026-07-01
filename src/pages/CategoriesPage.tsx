import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import type { Category } from '../types';

const categoryImages: Record<string, string> = {
  'Electronics': 'https://images.pexels.com/photos/356056/pexels-photo-356056.jpeg?auto=compress&cs=tinysrgb&w=600',
  'Fashion': 'https://images.pexels.com/photos/996329/pexels-photo-996329.jpeg?auto=compress&cs=tinysrgb&w=600',
  'Home & Garden': 'https://images.pexels.com/photos/2087382/pexels-photo-2087382.jpeg?auto=compress&cs=tinysrgb&w=600',
  'Sports & Outdoors': 'https://images.pexels.com/photos/1114095/pexels-photo-1114095.jpeg?auto=compress&cs=tinysrgb&w=600',
  'Books & Media': 'https://images.pexels.com/photos/book-book-pages-books-2762.jpg?auto=compress&cs=tinysrgb&w=600',
  'Health & Beauty': 'https://images.pexels.com/photos/3641056/pexels-photo-3641056.jpeg?auto=compress&cs=tinysrgb&w=600',
  'Toys & Games': 'https://images.pexels.com/photos/163016/toys-play-colour-party-163016.jpeg?auto=compress&cs=tinysrgb&w=600',
  'Automotive': 'https://images.pexels.com/photos/3802510/pexels-photo-3802510.jpeg?auto=compress&cs=tinysrgb&w=600',
  'default': 'https://images.pexels.com/photos/5632402/pexels-photo-5632402.jpeg?auto=compress&cs=tinysrgb&w=600',
};

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCategories();
  }, []);

  async function fetchCategories() {
    const { data } = await supabase
      .from('categories')
      .select('*')
      .order('name');
    if (data) setCategories(data);
    setLoading(false);
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Browse Categories</h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Find exactly what you're looking for by browsing our carefully curated product categories.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {categories.map((category) => (
          <Link
            key={category.id}
            to={`/products?category=${category.id}`}
            className="group relative aspect-[4/3] rounded-2xl overflow-hidden shadow-md hover:shadow-lg transition-all"
          >
            <img
              src={categoryImages[category.name] || categoryImages.default}
              alt={category.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-4">
              <h3 className="text-lg font-semibold text-white">{category.name}</h3>
              {category.description && (
                <p className="text-sm text-gray-300 line-clamp-2 mt-1">
                  {category.description}
                </p>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
