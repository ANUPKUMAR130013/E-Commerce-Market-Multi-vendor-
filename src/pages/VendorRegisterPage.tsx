import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Store, ArrowRight, CheckCircle, Loader2 } from 'lucide-react';

export default function VendorRegisterPage() {
  const { user, profile, signUp, signOut } = useAuth();
  const navigate = useNavigate();

  const [storeName, setStoreName] = useState('');
  const [storeDescription, setStoreDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'signup' | 'setup'>('signup');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { error } = await signUp(email, password, fullName, 'vendor');

    if (error) {
      setError(error.message || 'Failed to create account');
      setLoading(false);
      return;
    }

    // Switch to setup step
    setStep('setup');
    setLoading(false);
  }

  if (user) {
    if (profile?.role === 'vendor') {
      return (
        <div className="min-h-[80vh] flex items-center justify-center px-4">
          <div className="text-center">
            <CheckCircle className="w-16 h-16 text-success-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">You're already a vendor!</h1>
            <p className="text-gray-600 mb-6">Access your dashboard to manage your store.</p>
            <Link to="/vendor/dashboard" className="btn-primary btn-lg">
              Go to Dashboard
            </Link>
          </div>
        </div>
      );
    }

    // Customer wants to become a vendor
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-primary-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Store className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Become a Vendor</h1>
            <p className="text-gray-600 mt-2">Set up your store to start selling</p>
          </div>

          <div className="card p-8">
            <form onSubmit={async (e) => {
              e.preventDefault();
              setLoading(true);
              // Update profile to vendor
              const { updateProfile } = await import('../context/AuthContext').then(() => {});
              // Use the supabase client directly
              const { supabase } = await import('../lib/supabase');
              await supabase
                .from('profiles')
                .update({
                  role: 'vendor',
                  store_name: storeName,
                  store_description: storeDescription,
                })
                .eq('id', user.id);
              navigate('/vendor/dashboard');
            }} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Store Name *
                </label>
                <input
                  type="text"
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  required
                  placeholder="Your Store Name"
                  className="input"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Store Description
                </label>
                <textarea
                  value={storeDescription}
                  onChange={(e) => setStoreDescription(e.target.value)}
                  rows={4}
                  placeholder="Tell customers about your store..."
                  className="input resize-none"
                />
              </div>

              <button type="submit" disabled={loading || !storeName} className="w-full btn-primary btn-lg">
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    Create Store
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Store className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Start Selling on MarketHub</h1>
          <p className="text-gray-600 mt-2">Create your vendor account in minutes</p>
        </div>

        <div className="card p-8">
          {error && (
            <div className="bg-error-50 border border-error-200 text-error-700 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSignUp} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full Name *
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                placeholder="John Doe"
                className="input"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email *
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                className="input"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password *
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                placeholder="Create a password"
                className="input"
              />
              <p className="text-xs text-gray-500 mt-1">
                Must be at least 6 characters
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Store Name *
              </label>
              <input
                type="text"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                required
                placeholder="Your Store Name"
                className="input"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary btn-lg"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  Create Vendor Account
                  <ArrowRight className="w-5 h-5 ml-2" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Already have an account?{' '}
              <Link to="/login" className="text-primary-600 hover:underline font-medium">
                Sign in
              </Link>
            </p>
          </div>
        </div>

        <div className="mt-8">
          <div className="flex items-center gap-4 justify-center text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-success-500" />
              <span>No listing fees</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-success-500" />
              <span>Easy setup</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-success-500" />
              <span>Secure payments</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
