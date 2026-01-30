import { useEffect, useState } from "react";
import MainLayout from "../layouts/MainLayout";

export default function CheckoutPage() {
  const [cart, setCart] = useState([]);
  const [appliedDiscount, setAppliedDiscount] = useState(0);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    county: "",
    town: "",
    instructions: "",
    amount: "",
    reference: "",
  });
  const [shipping, setShipping] = useState(0);
  const [total, setTotal] = useState(0);
  const [confirmationMessage, setConfirmationMessage] = useState("");

  // Load cart and coupon on mount
  useEffect(() => {
    const savedCart = JSON.parse(localStorage.getItem("cart")) || [];
    setCart(savedCart);

    const savedCoupon = JSON.parse(localStorage.getItem("appliedCoupon"));
    if (savedCoupon) setAppliedDiscount(savedCoupon.discount);
  }, []);

  // Compute subtotal
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  // Compute shipping whenever county changes
  useEffect(() => {
    const county = formData.county.trim().toLowerCase();
    let shippingCost = 0;

    if (county === "kisumu") shippingCost = 100;
    else if (county) shippingCost = 300;
    else shippingCost = 0;

    setShipping(shippingCost);

    const discountedSubtotal = subtotal - subtotal * appliedDiscount;
    setTotal(discountedSubtotal + shippingCost);
  }, [formData.county, subtotal, appliedDiscount]);

  // Handle input changes
  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();

    const { name, phone, email, county, town, amount, reference } = formData;
    if (!name || !phone || !email || !county || !town || !amount || !reference) {
      alert("Please fill in all required fields.");
      return;
    }

    const order = {
      customer: formData,
      amountPaid: amount,
      paymentReference: reference,
      timestamp: new Date().toISOString(),
      cart,
    };

    localStorage.setItem("lastOrder", JSON.stringify(order));
    setConfirmationMessage(
      "Thank you! We have received your order. We'll contact you shortly to confirm delivery."
    );

    localStorage.removeItem("cart");
    localStorage.removeItem("appliedCoupon");
    setCart([]);
  };

  return (
    <MainLayout>
      <section id="checkout" className="section-p1">
        <h2>Checkout</h2>
        <form onSubmit={handleSubmit}>
          <h3>Customer Details</h3>

          <label htmlFor="name">Full Name:</label>
          <input type="text" id="name" value={formData.name} onChange={handleChange} required />

          <label htmlFor="phone">Phone Number:</label>
          <input type="tel" id="phone" value={formData.phone} onChange={handleChange} required />

          <label htmlFor="email">Email Address:</label>
          <input type="email" id="email" value={formData.email} onChange={handleChange} required />

          <label htmlFor="county">County:</label>
          <input type="text" id="county" value={formData.county} onChange={handleChange} required />

          <label htmlFor="town">Town/Area:</label>
          <input type="text" id="town" value={formData.town} onChange={handleChange} required />

          <label htmlFor="instructions">Delivery Instructions:</label>
          <textarea id="instructions" rows="4" value={formData.instructions} onChange={handleChange}></textarea>

          <h3>Order Summary</h3>
          <p id="order-summary">
            Subtotal: Ksh. {subtotal.toFixed(2)}<br />
            Discount: -Ksh. {(subtotal * appliedDiscount).toFixed(2)}<br />
            Shipping: Ksh. {shipping}<br />
            <strong>Total: Ksh. {total.toFixed(2)}</strong>
          </p>

          <h3>Payment Method</h3>
          <p>Please pay via M-PESA to: <strong>0700000000</strong></p>

          <h4>After payment:</h4>
          <label htmlFor="amount">Amount Paid:</label>
          <input type="number" id="amount" min="1" value={formData.amount} onChange={handleChange} required />

          <label htmlFor="reference">M-PESA Reference Code:</label>
          <input type="text" id="reference" value={formData.reference} onChange={handleChange} required />

          <button type="submit" className="normal">I Have Paid</button>

          {confirmationMessage && (
            <p style={{ marginTop: "15px", color: "green" }}>{confirmationMessage}</p>
          )}
        </form>
      </section>
    </MainLayout>
  );
}
