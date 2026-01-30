import { useCallback, useEffect, useState, useMemo } from "react";
import MainLayout from "../layouts/MainLayout";

export default function CartPage() {
  const [cart, setCart] = useState([]);
  const [appliedDiscount, setAppliedDiscount] = useState(0);
  const [region, setRegion] = useState("");
  const [message, setMessage] = useState("");

  // Load cart from localStorage
  useEffect(() => {
    const savedCart = JSON.parse(localStorage.getItem("cart")) || [];
    setCart(savedCart);

    const savedCoupon = JSON.parse(localStorage.getItem("appliedCoupon"));
    if (savedCoupon) {
      setAppliedDiscount(savedCoupon.discount);
      setMessage(`Coupon "${savedCoupon.code}" re-applied.`);
      // setMessage(`Coupon "${savedCoupon.code}" re-applied.`);
    }
  }, []);

  const removeFromCart = (index) => {
    const updatedCart = [...cart];
    updatedCart.splice(index, 1);
    setCart(updatedCart);
    localStorage.setItem("cart", JSON.stringify(updatedCart));
    window.dispatchEvent(new CustomEvent("cartChanged", { detail: updatedCart }));
  };

  const updateQuantity = (index, newQuantity) => {
    const quantity = parseInt(newQuantity);
    if (isNaN(quantity) || quantity < 1) return;
    const updatedCart = [...cart];
    updatedCart[index].quantity = quantity;
    setCart(updatedCart);
    localStorage.setItem("cart", JSON.stringify(updatedCart));
    window.dispatchEvent(new CustomEvent("cartChanged", { detail: updatedCart }));
  };

  const getShippingCost = (region) => {
    switch (region) {
      case "nairobi": return 100;
      case "kenya": return 300;
      case "international": return 0;
      default: return 0;
    }
  };

  const subtotal = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const coupons = useMemo(() => ({
    SAVE10: { discount: 0.1, minSubtotal: 5000 },
    SAVE20: { discount: 0.2, minSubtotal: 9900 }
  }), []);
        
  const autoApplyBestCoupon = useCallback(() => {
    let bestCoupon = null;
    for (const code in coupons) {
      const { discount, minSubtotal } = coupons[code];
      if (subtotal >= minSubtotal) {
        if (!bestCoupon || discount > coupons[bestCoupon].discount) bestCoupon = code;
      }
    }
    if (bestCoupon) {
      const { discount } = coupons[bestCoupon];
      setAppliedDiscount(discount);
      localStorage.setItem("appliedCoupon", JSON.stringify({ code: bestCoupon, discount }));
      setMessage(`Coupon "${bestCoupon}" applied automatically.`);
      // setMessage(`Coupon "${bestCoupon}" applied automatically.`);
      setAppliedDiscount(0);
      localStorage.removeItem("appliedCoupon");
      setMessage("No active coupons applied.");
      // setMessage("No active coupons applied.");
    }
  }, [subtotal, coupons]);

  useEffect(() => { autoApplyBestCoupon(); }, [autoApplyBestCoupon]);

  const shippingCost = getShippingCost(region);
  const discountedSubtotal = subtotal - subtotal * appliedDiscount;
  const total = region === "international" ? "To be discussed" : (discountedSubtotal + shippingCost).toFixed(2);

  return (
    <MainLayout>
      <section id="cart-hero">
        <h2>Your Cart</h2>
        <p>Review your items and proceed to checkout.</p>
        {message && <div className="cart-message">{message}</div>}
      </section>

      <section id="cart-cards" className="section-p1">
        <div className="cart-products">
          {cart.length === 0 ? (
            <p className="empty-cart">Your cart is empty.</p>
          ) : (
            cart.map((item, index) => (
              <div className="cart-card" key={index}>
                <img src={item.image} alt={item.name} />
                <div className="cart-card-details">
                  <h3>{item.name}</h3>
                  <p>Size: <strong>{item.size}</strong></p>
                  <p>Price: Ksh {item.price}</p>
                  <div className="cart-card-qty">
                    <label>Qty: </label>
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => updateQuantity(index, e.target.value)}
                    />
                  </div>
                  <p>Subtotal: Ksh {(item.price * item.quantity).toFixed(2)}</p>
                  <button onClick={() => removeFromCart(index)}>Remove</button>
                </div>
              </div>
            ))
          )}
        </div>

        {cart.length > 0 && (
          <div className="cart-summary">
            <h3>Order Summary</h3>
            <p>Cart Subtotal: Ksh {subtotal.toFixed(2)}</p>
            <p>
              Shipping:
              <select value={region} onChange={(e) => setRegion(e.target.value)}>
                <option>Select Location</option>
                <option value="kisumu">Kisumu County</option>
                <option value="kenya">Other Kenyan Counties</option>
                <option value="international">Outside Kenya</option>
              </select>
            </p>
            <p>Shipping Cost: {region === "international" ? "To be discussed" : `Ksh ${shippingCost}`}</p>
            {appliedDiscount > 0 && <p>Discount: {appliedDiscount * 100}%</p>}
            <p className="cart-total">Total: {total}</p>
            <button onClick={() => (window.location.href = "/checkout")}>Proceed to Checkout</button>
          </div>
        )}
      </section>
    </MainLayout>
  );
}
