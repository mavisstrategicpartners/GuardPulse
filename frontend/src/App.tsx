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
import Login from "./pages/Login";
import Register from "./pages/Register";
import Account from "./pages/Account";

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
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/account" element={<Account />} />
          <Route path="/returns" element={<Returns />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/delivery" element={<Delivery />} />
          <Route path="/contact" element={<Contact />} />
        </Routes>
        <Footer />
        <CartDrawer />
      </div>
    </CartProvider>
    </AuthProvider>
  );
}