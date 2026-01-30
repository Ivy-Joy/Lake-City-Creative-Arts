# 📍 Lake City Creative Arts
> **Handcrafted Elegance. Cultural Authenticity. Modern Commerce.**

Lake City Creative Arts is a premium e-commerce platform dedicated to showcasing authentic Maasai sandals and handcrafted leather goods. Born in Kenya, our mission is to bridge the gap between traditional craftsmanship and the global digital marketplace.



---

## ✨ Features

### 🛍️ Luxury Shopping Experience
- **Curated Collections:** Specialized categories for Men, Women, Kids, and Unisex designs.
- **Dynamic Cart System:** Real-time quantity updates and automatic discount application for bulk orders.
- **Responsive Design:** A seamless "Mobile-First" experience, ensuring the sandals look as good on a phone as they do in person.

### 🔐 Secure & Personalized Authentication
- **JWT-Powered Security:** Robust authentication flow using access tokens (in-memory) and HTTP-only refresh cookies.
- **User Dashboards:** Personalized profile management, order history tracking, and real-time order status updates.
- **Silent Refresh:** A seamless user experience where sessions are maintained securely without annoying re-logins.

### 🛠️ Technical Excellence
- **Frontend:** Built with **React 18** and **Vite** for lightning-fast performance.
- **State Management:** Custom React Context API for Global Auth and UI states.
- **Backend Integration:** Communicates with a custom Node/Express REST API.
- **Theming:** Integrated Dark/Light mode support tailored for luxury aesthetics.

---

## 🚀 Tech Stack

| Frontend | Backend (API) | Security |
| :--- | :--- | :--- |
| React.js (Vite) | Node.js / Express | JWT (JSON Web Tokens) |
| CSS3 (Custom Variables) | MongoDB / Mongoose | HTTP-Only Cookies |
| React Router 6 | RESTful Architecture | CORS Middleware |

---

## 📂 Project Structure

```text
src/
├── auth/           # Secure Route protection, Login/Register logic
├── components/     # Reusable UI (Header, SearchBar, Footers)
├── layouts/        # Page wrappers (MainLayout)
├── pages/          # Full-page views (Shop, Account, Blog, Cart)
├── services/       # API wrapper & Axios-style fetch interceptors
└── assets/         # High-resolution branding and imagery
⚙️ Installation & Setup 
Clone the repository

Bash
git clone [https://github.com/your-username/lake-city-creative-arts.git](https://github.com/your-username/lake-city-creative-arts.git)
Install dependencies

Bash
npm install
Configure Environment Variables Create a .env file in the root:

Code snippet
VITE_API_URL=http://localhost:5000
Run Development Server

Bash
npm run dev
🌍 Social Impact
Every purchase through Lake City Creative Arts directly supports local artisans in Kenya, preserving the heritage of Maasai beadwork and leather craftsmanship for future generations.
