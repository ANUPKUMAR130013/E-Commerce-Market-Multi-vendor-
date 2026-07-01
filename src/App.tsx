import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import ProductsPage from './pages/ProductsPage';
import ProductDetailPage from './pages/ProductDetailPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import OrdersPage from './pages/OrdersPage';
import CategoriesPage from './pages/CategoriesPage';
import VendorDashboard from './pages/vendor/VendorDashboard';
import VendorProducts from './pages/vendor/VendorProducts';
import ProductForm from './pages/vendor/ProductForm';
import VendorOrders from './pages/vendor/VendorOrders';
import VendorRegisterPage from './pages/VendorRegisterPage';

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<HomePage />} />
              <Route path="products" element={<ProductsPage />} />
              <Route path="products/:slug" element={<ProductDetailPage />} />
              <Route path="cart" element={<CartPage />} />
              <Route path="checkout" element={<CheckoutPage />} />
              <Route path="login" element={<LoginPage />} />
              <Route path="register" element={<RegisterPage />} />
              <Route path="orders" element={<OrdersPage />} />

              {/* Vendor Routes */}
              <Route path="vendor/register" element={<VendorRegisterPage />} />
              <Route path="vendor/dashboard" element={<VendorDashboard />} />
              <Route path="vendor/products" element={<VendorProducts />} />
              <Route path="vendor/products/new" element={<ProductForm />} />
              <Route path="vendor/products/:id/edit" element={<ProductForm />} />
              <Route path="vendor/orders" element={<VendorOrders />} />

              {/* Categories */}
              <Route path="categories" element={<CategoriesPage />} />
              <Route path="deals" element={<ProductsPage />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
