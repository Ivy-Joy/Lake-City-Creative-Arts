import React, { useEffect, useState } from "react";
import { useAuthContext } from "../auth/useAuthContext.jsx";
import { useNavigate, Link } from "react-router-dom";
import api from "../services/api"; // Import your api service
import "./AccountPage.css";

export default function AccountPage() {
  const { user, logout } = useAuthContext(); // Use direct 'user' and 'logout'
  const [orders, setOrders] = useState([]);
  const [showEdit, setShowEdit] = useState(false);
  const [profile, setProfile] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // If the checkAuth in useAuth hasn't found a user, go to login
    if (!user) {
      navigate("/login");
      return;
    }

    const loadData = async () => {
      try {
        // Fetch profile using the API service (handles headers/refresh automatically)
        const profileData = await api.get("/api/auth/me");
        setProfile(profileData.user);

        // Fetch orders
        const ordersData = await api.get("/api/orders/mine");
        setOrders(Array.isArray(ordersData) ? ordersData : []);
      } catch (err) {
        console.error("Account load error:", err);
        if (err.status === 401) {
          navigate("/login");
        }
      }
    };

    loadData();
  }, [user, navigate]);

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    const form = new FormData(e.target);
    const body = {
      firstName: form.get("firstName"),
      lastName: form.get("lastName"),
      phone: form.get("phone"),
    };

    try {
      const updatedUser = await api.put("/api/users/update", body);
      setProfile(updatedUser);
      setShowEdit(false);
    } catch (err) {
      console.error("Profile update error:", err);
    }
  };

  if (!profile) return <div className="account-loading">Loading your account...</div>;

  return (
    <div className="account-page">
      <header className="account-header">
        <div className="account-avatar">{profile?.firstName?.charAt(0).toUpperCase()}</div>
        <div>
          <h1>Welcome, {profile?.firstName || "User"} 👋</h1>
          <p>{profile?.email}</p>
        </div>
        <button onClick={handleLogout} className="logout-btn">
          Logout
        </button>
      </header>

      <section className="profile-section">
        <div className="profile-top">
          <h2>Profile</h2>
          <button onClick={() => setShowEdit(true)}>Edit</button>
        </div>

        <div className="profile-info">
          <div>
            <label>User ID</label>
            <p>{profile.userId || profile._id}</p>
          </div>
          <div>
            <label>Full Name</label>
            <p>{profile.firstName} {profile.lastName}</p>
          </div>
          <div>
            <label>Email</label>
            <p>{profile.email}</p>
          </div>
          <div>
            <label>Phone</label>
            <p>{profile.phone || "Not provided"}</p>
          </div>
          <div>
            <label>Account Created</label>
            <p>{new Date(profile.createdAt).toLocaleDateString()}</p>
          </div>
          <div>
            <label>Email Verified</label>
            <p>{profile.isVerified ? "✅ Yes" : "❌ No"}</p>
          </div>
        </div>
      </section>

      <section className="orders-section">
        <h2>Order History</h2>
        {orders.length === 0 ? (
          <p>No orders yet. <Link to="/shop">Start shopping →</Link></p>
        ) : (
          <table className="orders-table">
            <thead>
              <tr>
                <th>Order #</th>
                <th>Date</th>
                <th>Total</th>
                <th>Status</th>
                <th>Receipt</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o._id}>
                  <td>{o._id.slice(-6).toUpperCase()}</td>
                  <td>{new Date(o.createdAt).toLocaleDateString()}</td>
                  <td>Ksh. {o.amountPaid?.toLocaleString()}</td>
                  <td>
                    <span className={`status ${o.status?.toLowerCase()}`}>{o.status}</span>
                  </td>
                  <td>
                    <Link to={`/receipt/${o._id}`} className="receipt-link">View</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {showEdit && (
        <div className="modal-overlay" onClick={() => setShowEdit(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Edit Profile</h3>
            <form onSubmit={handleProfileUpdate}>
              <input name="firstName" defaultValue={profile.firstName} required placeholder="First Name" />
              <input name="lastName" defaultValue={profile.lastName} required placeholder="Last Name" />
              <input name="phone" defaultValue={profile.phone || ""} placeholder="+254..." />
              <div className="modal-actions">
                <button type="submit">Save</button>
                <button type="button" onClick={() => setShowEdit(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}