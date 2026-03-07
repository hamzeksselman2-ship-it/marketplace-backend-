const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

const corsOptions = {
  origin: 'https://hamza-ethio-market.netlify.app', 
  optionsSuccessStatus: 200,
  credentials: true 
};

app.use(cors(corsOptions));
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log("✅ Connected to MongoDB Atlas"))
  .catch(err => console.error("❌ MongoDB Connection Error:", err));

// User Schema (አዲስ የተጨመረ - ለተጠቃሚዎች)
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }
});
const User = mongoose.model('User', userSchema);

// Product Schema
const productSchema = new mongoose.Schema({
  title: { type: String, required: true },
  price: { type: Number, required: true },
  description: String,
  imageUrl: String,
  isBoosted: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});
const Product = mongoose.model('Product', productSchema);

// --- API ROUTES ---

// 1. ምርቶችን ለማምጣት
app.get('/api/products', async (req, res) => {
  try {
    const products = await Product.find().sort({ isBoosted: -1, createdAt: -1 });
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 2. አዲስ ተጠቃሚ ለመመዝገብ (Signup)
app.post('/api/signup', async (req, res) => {
  try {
    const { email, password } = req.body;
    const newUser = new User({ email, password });
    await newUser.save();
    res.status(201).json({ message: "ተጠቃሚ በስኬት ተመዝግቧል!" });
  } catch (err) {
    res.status(400).json({ message: "ምዝገባው አልተሳካም: " + err.message });
  }
});

// 3. ለመግባት (Login)
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email, password });
    if (user) {
      res.json({ message: "እንኳን ደህና መጡ!", user });
    } else {
      res.status(401).json({ message: "ኢሜል ወይም ፓስወርድ ተሳስቷል" });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get('/api/health', (req, res) => res.send("Backend is Healthy!"));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
