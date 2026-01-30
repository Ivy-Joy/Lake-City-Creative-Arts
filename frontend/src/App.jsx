import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import "./index.css";
import Header from "./components/Header.jsx";
import Footer from "./components/Footer.jsx";
import ScrollToTop from "./components/ScrollToTop";
import AboutPage from "./pages/AboutPage.jsx";
import BlogPage from "./pages/BlogPage.jsx";
import BlogPostPage from "./pages/BlogPostPage.jsx";
import CartPage from "./pages/CartPage.jsx";
import CheckoutPage from "./pages/CheckoutPage.jsx";
import ContactPage from "./pages/ContactPage.jsx";
import HomePage from "./pages/HomePage.jsx";
import ShopPage from "./pages/ShopPage.jsx";
import ProductPage from "./pages/ProductPage.jsx";
import ReceiptPage from "./pages/ReceiptPage.jsx";

import LoginForm from "./auth/LoginForm.jsx";
import RegisterForm from "./auth/RegisterForm.jsx";
import RequireAuth from "./auth/RequireAuth.jsx";
import { AuthProvider } from "./auth/AuthProvider.jsx";
import { ErrorBoundary } from "./auth/ErrorBoundary.jsx";

import VerifyEmail from "./auth/VerifyEmail.jsx";
import ForgotPasswordPage from "./auth/ForgotPasswordPage.jsx";

import AccountPage from "./auth/AccountPage.jsx";

function App() {

  return (
    <Router>
      <ErrorBoundary>
        <AuthProvider>
          <ScrollToTop />
          <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/shop" element={<ShopPage />} />
          <Route path="/product/:id" element={<ProductPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/blog" element={<BlogPage />} />
          <Route path="/blog/:id" element={<BlogPostPage />} />
          {/* Protected route, only logged in user can see */}
          <Route path="/receipt" element={<RequireAuth><ReceiptPage /></RequireAuth>} />

          <Route path="/verify-email" element={<VerifyEmail />} />
          
          <Route path="/login" element={<LoginForm />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/register" element={<RegisterForm />} />

          <Route path="/account" element={<AccountPage />} />

          </Routes>
        </AuthProvider>
     </ErrorBoundary>
   </Router>
  );
}

export default App
// pages → full-page views (route-level components).
// components → reusable UI building blocks.
// data → static or mock data.