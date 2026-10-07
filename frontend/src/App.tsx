import { Routes, Route } from "react-router-dom";
import { CartProvider } from "./api/CartContext";
import { AuthProvider } from "./api/AuthContext";
import Header from "./components/Header";
import CartDrawer from "./components/CartDrawer";
import Footer from "./components/Footer";
import Home from "./pages/Home";
import Checkout from "./pages/Checkout";
import OrderConfirmation from "./pages/OrderConfirmation";
import Returns from "./pages/legal/Returns";
import Privacy from "./pages/legal/Privacy";
import Terms from "./pages/legal/Terms";
import Delivery from "./pages/legal/Delivery";
import Contact from "./pages/legal/Contact";
import TrackOrder from "./pages/TrackOrder";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import ForgotPassword from "./pages/auth/ForgotPassword";
import ResetPassword from "./pages/auth/ResetPassword";
import Account from "./pages/auth/Account";

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <div className="min-h-screen bg-paper text-ink">
          <Header />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/order/:reference" element={<OrderConfirmation />} />
            <Route path="/track-order" element={<TrackOrder />} />
            <Route path="/returns" element={<Returns />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/delivery" element={<Delivery />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/account" element={<Account />} />
          </Routes>
          <Footer />
          <CartDrawer />
        </div>
      </CartProvider>
    </AuthProvider>
  );
}