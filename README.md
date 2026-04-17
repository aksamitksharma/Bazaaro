# Bazaaro 🛒🚀

**Bazaaro** is a Hyperlocal Ecommerce & Delivery Marketplace connecting local shops (kirana, street vendors, bakery, etc.) with nearby customers. The platform is designed to help local vendors digitize their stores instantly, allow customers to discover fresh local goods, and enable delivery partners to fulfill orders using AI-powered geospatial assignments.

## 🌟 Key Features
- **Hyperlocal Discovery**: Geo-fenced sorting displaying vendors and products closest to the customer's location.
- **Multiple Roles**: Comprehensive dashboards for Customers, Vendors, Delivery Partners, and Admins.
- **AI-Powered Savings (Combos)**: Automatic basket-level cost comparison helping customers find the absolute cheapest store for their entire cart.
- **Dynamic Delivery Allocation**: Real-time rider assignment based on a $near MongoDB geospatial query (calculating distance/ETAs).
- **Coupons & Discounts**: Complex cart validation rules (min amounts, usage caps, festive percentage discounts).
- **Modern UI**: Smooth Framer Motion animations, sleek transitions, and premium glassmorphism components overriding raw Tailwind defaults.

## 🛠️ Tech Stack
- **Frontend**: React.js + Vite, Redux Toolkit, Framer Motion, Axios.
- **Backend**: Node.js, Express.js.
- **Database**: MongoDB (Mongoose) + Geospatial (`2dsphere`) indexing.
- **Real-Time**: Socket.io for live order tracking and dispatch alerts.
- **Authentication**: JWT & OTP-based verification structure (in dev mode, default pass overrides exist).

## 🚀 Installation & Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/aksamitksharma/Bazaaro.git
   cd Bazaaro
   ```

2. **Install Dependencies**
   The project has a unified install script:
   ```bash
   npm run install-all
   ```

3. **Database Configuration**
   - Install **MongoDB Community Server** locally.
   - Or, create a cluster on **MongoDB Atlas** and setup your `.env` in the root:
     ```env
     PORT=5000
     MONGODB_URI=mongodb://localhost:27017/bazaaro
     JWT_SECRET=your_super_secret_key
     ```

4. **Seed Database (Essential for Testing)**
   To quickly create admin, multiple customers, vendors, and products with randomized test data:
   ```bash
   npm run seed
   ```

5. **Run the Application**
   ```bash
   npm run dev
   ```
   *This concurrently spins up the Vite frontend (`http://localhost:5173`) and Express backend (`http://localhost:5000`).*

## 🧑‍💻 Default Test Credentials (Post Setup)

- **Admin Account**: `9999999999` (Password: `admin123`)
- **Customer Account**: `9800000000` (Password: `user123`)
- **Vendor Account**: `9700000000` (Password: `vendor123`)
- **Delivery Partner**: `9600000000` (Password: `delivery123`)

---
**Build with ❤️ for Local Communities.**
