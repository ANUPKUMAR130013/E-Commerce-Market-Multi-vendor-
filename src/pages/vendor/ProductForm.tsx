import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import type { Category, Product } from '../../types';
import { ArrowLeft, Save, Loader2, Image, X, Plus } from 'lucide-react';

export default function ProductForm() {
  const { user, profile, loading: authLoading } = useAuth();
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    compare_price: '',
    stock_quantity: '0',
    category_id: '',
    status: 'draft' as 'draft' | 'active',
    featured: false,
  });

  const [images, setImages] = useState<string[]>([]);
  const [newImageUrl, setNewImageUrl] = useState('');

  useEffect(() => {
    fetchCategories();
    if (isEditing && id) {
      fetchProduct();
    }
  }, [id]);

  async function fetchCategories() {
    const { data } = await supabase.from('categories').select('*').order('name');
    if (data) setCategories(data);
  }

  async function fetchProduct() {
    const { data } = await supabase
      .from('products')
      .select(`*, images:product_images (*)`)
      .eq('id', id)
      .maybeSingle();

    if (data && data.vendor_id === user?.id) {
      setFormData({
        name: data.name,
        description: data.description || '',
        price: data.price.toString(),
        compare_price: data.compare_price?.toString() || '',
        stock_quantity: data.stock_quantity.toString(),
        category_id: data.category_id || '',
        status: data.status,
        featured: data.featured,
      });
      setImages(data.images?.map((i: any) => i.url) || []);
    }
    setLoading(false);
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === 'checkbox'
          ? (e.target as HTMLInputElement).checked
          : value,
    }));
  };

  const addImage = () => {
    if (newImageUrl.trim() && !images.includes(newImageUrl.trim())) {
      setImages([...images, newImageUrl.trim()]);
      setNewImageUrl('');
    }
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  async function generateSlug(name: string): Promise<string> {
    const baseSlug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    let slug = baseSlug;
    let counter = 1;

    while (true) {
      const query = supabase
        .from('products')
        .select('id')
        .eq('slug', slug);

      if (isEditing) {
        query.neq('id', id);
      }

      const { data } = await query.maybeSingle();
      if (!data) break;
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    return slug;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!formData.name || !formData.price) {
      setError('Name and price are required');
      return;
    }

    setSaving(true);

    try {
      const slug = await generateSlug(formData.name);

      const productData = {
        name: formData.name,
        slug,
        description: formData.description || null,
        price: parseFloat(formData.price),
        compare_price: formData.compare_price ? parseFloat(formData.compare_price) : null,
        stock_quantity: parseInt(formData.stock_quantity) || 0,
        category_id: formData.category_id || null,
        status: formData.status,
        featured: formData.featured,
        vendor_id: user!.id,
      };

      let productId: string;

      if (isEditing) {
        const { error: updateError } = await supabase
          .from('products')
          .update({
            ...productData,
            vendor_id: undefined,
          })
          .eq('id', id);

        if (updateError) throw updateError;
        productId = id!;
      } else {
        const { data, error: insertError } = await supabase
          .from('products')
          .insert(productData)
          .select('id')
          .maybeSingle();

        if (insertError) throw insertError;
        productId = data.id;
      }

      // Handle images
      if (isEditing) {
        await supabase.from('product_images').delete().eq('product_id', productId);
      }

      if (images.length > 0) {
        const imageData = images.map((url, index) => ({
          product_id: productId,
          url,
          alt_text: formData.name,
          position: index,
        }));

        const { error: imageError } = await supabase
          .from('product_images')
          .insert(imageData);

        if (imageError) throw imageError;
      }

      navigate('/vendor/products');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save product');
    } finally {
      setSaving(false);
    }
  }

  if (authLoading || loading) {
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
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <Link
          to="/vendor/products"
          className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Products
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">
          {isEditing ? 'Edit Product' : 'Add New Product'}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {error && (
          <div className="bg-error-50 border border-error-200 text-error-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Basic Info */}
        <div className="card p-6">
          <h2 className="font-semibold text-gray-900 mb-6">Basic Information</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Product Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                placeholder="Enter product name"
                className="input"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={4}
                placeholder="Describe your product..."
                className="input resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <select
                name="category_id"
                value={formData.category_id}
                onChange={handleChange}
                className="input"
              >
                <option value="">Select a category</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Images */}
        <div className="card p-6">
          <h2 className="font-semibold text-gray-900 mb-6">Product Images</h2>

          <div className="space-y-4">
            <div className="flex gap-2">
              <input
                type="url"
                value={newImageUrl}
                onChange={(e) => setNewImageUrl(e.target.value)}
                placeholder="Enter image URL"
                className="input flex-1"
              />
              <button
                type="button"
                onClick={addImage}
                className="btn-secondary btn-md"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add
              </button>
            </div>

            {images.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {images.map((url, index) => (
                  <div
                    key={index}
                    className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden group"
                  >
                    <img
                      src={url}
                      alt={`Product ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-2 right-2 p-1 bg-white rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-4 h-4 text-gray-600" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <Image className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500">No images added yet</p>
                <p className="text-sm text-gray-400 mt-1">
                  Add images by entering URLs above
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Pricing & Inventory */}
        <div className="card p-6">
          <h2 className="font-semibold text-gray-900 mb-6">Pricing & Inventory</h2>

          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Price *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  $
                </span>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  required
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  className="input pl-7"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Compare at Price
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  $
                </span>
                <input
                  type="number"
                  name="compare_price"
                  value={formData.compare_price}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  className="input pl-7"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Original price for showing discount
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Stock Quantity
              </label>
              <input
                type="number"
                name="stock_quantity"
                value={formData.stock_quantity}
                onChange={handleChange}
                min="0"
                placeholder="0"
                className="input"
              />
            </div>
          </div>
        </div>

        {/* Status */}
        <div className="card p-6">
          <h2 className="font-semibold text-gray-900 mb-6">Status</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Product Status
              </label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="status"
                    checked={formData.status === 'draft'}
                    onChange={() =>
                      setFormData((prev) => ({ ...prev, status: 'draft' }))
                    }
                    className="w-4 h-4 text-primary-600 focus:ring-primary-500"
                  />
                  <span>Draft</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="status"
                    checked={formData.status === 'active'}
                    onChange={() =>
                      setFormData((prev) => ({ ...prev, status: 'active' }))
                    }
                    className="w-4 h-4 text-primary-600 focus:ring-primary-500"
                  />
                  <span>Active</span>
                </label>
              </div>
            </div>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                name="featured"
                checked={formData.featured}
                onChange={handleChange}
                className="w-4 h-4 rounded text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm">Feature this product on homepage</span>
            </label>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-4">
          <button
            type="submit"
            disabled={saving}
            className="btn-primary btn-lg"
          >
            {saving ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-5 h-5 mr-2" />
                Save Product
              </>
            )}
          </button>

          <Link to="/vendor/products" className="btn-secondary btn-lg">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
