import { useEffect, useState } from "react";
import MainLayout from "../layouts/MainLayout";

export default function ReceiptPage() {
  const [order, setOrder] = useState(null);
  const [totals, setTotals] = useState({
    subtotal: 0,
    discountAmount: 0,
    shipping: 0,
    total: 0,
    shippingText: "",
  });

  useEffect(() => {
    const savedOrder = JSON.parse(localStorage.getItem("lastOrder"));
    if (!savedOrder) return;
    setOrder(savedOrder);

    // Recalculate totals from the saved order
    const subtotal = savedOrder.cart.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    const appliedCoupon = JSON.parse(localStorage.getItem("appliedCoupon"));
    const discount = appliedCoupon?.discount || 0;
    const discountAmount = subtotal * discount;

    // Shipping logic based on county
    const county = savedOrder.customer.county?.trim().toLowerCase();
    let shipping = 0;
    let shippingText = "";

    if (county === "kisumu") {
      shipping = 100;
      shippingText = `Ksh. ${shipping}`;
    } else if (county && county !== "international") {
      shipping = 300;
      shippingText = `Ksh. ${shipping}`;
    } else if (county === "international") {
      shipping = 0;
      shippingText = "To be discussed";
    } else {
      shippingText = "Ksh. 0";
    }

    const total =
      county === "international"
        ? "To be discussed"
        : (subtotal - discountAmount + shipping).toFixed(2);

    setTotals({
      subtotal,
      discountAmount,
      shipping,
      total,
      shippingText,
    });
  }, []);

  const handlePrint = () => {
    window.print();
  };

  if (!order) {
    return (
      <MainLayout>
        <section id="receipt" className="section-p1">
          <h2>Thank You for Your Order!</h2>
          <p style={{ color: "red" }}>
            No order data found. Please go back to the shop.
          </p>
        </section>
      </MainLayout>
    );
  }

  const orderNumber = new Date(order.timestamp).getTime();

  return (
    <MainLayout>
      <section id="receipt" className="section-p1">
        <h2>Thank You for Your Order!</h2>
        <div id="receipt-content">
          <h3>Order #: {orderNumber}</h3>

          <h4>Customer Information</h4>
          <p><strong>Name:</strong> {order.customer.name}</p>
          <p><strong>Phone:</strong> {order.customer.phone}</p>
          <p><strong>Email:</strong> {order.customer.email}</p>
          <p><strong>County:</strong> {order.customer.county}</p>
          <p><strong>Town/Area:</strong> {order.customer.town}</p>

          <h4>Delivery Instructions</h4>
          <p>{order.customer.instructions || "(None)"}</p>

          <h4>Items Purchased</h4>
          <ul>
            {order.cart.map((item, index) => (
              <li key={index}>
                {item.quantity} x {item.name} ({item.size}) - Ksh.{" "}
                {(item.quantity * item.price).toFixed(2)}
              </li>
            ))}
          </ul>

          <h4>Totals</h4>
          <p>Subtotal: Ksh. {totals.subtotal.toFixed(2)}</p>
          <p>Discount: -Ksh. {totals.discountAmount.toFixed(2)}</p>
          <p>Shipping: {totals.shippingText}</p>
          <p><strong>Total: {totals.total}</strong></p>

          <h4>Payment</h4>
          <p><strong>Amount Paid:</strong> Ksh. {parseFloat(order.amountPaid).toFixed(2)}</p>
          <p><strong>M-PESA Reference:</strong> {order.paymentReference}</p>

          <div className="success-message">
            We'll contact you soon to confirm your delivery.
          </div>
        </div>

        <a href="/shop" className="btn-back">← Back to Shop</a>
        <button
          onClick={handlePrint}
          className="btn-back"
          style={{ marginTop: "20px" }}
        >
          🖨️ Print or Download Receipt
        </button>
      </section>
    </MainLayout>
  );
}
