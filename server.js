const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();
const app = express();

// Middleware
app.use(express.json());

// CORS ማስተካከያ - ለሁለቱም ሊንኮች ፈቃድ ሰጥተናል
app.use(cors({
  origin: [
    'https://hamza-ethio-market.netlify.app', 
    'https://marketplace-frontend-final.vercel.app'
  ],
  credentials: true
}));

// የዳታቤዝ ግንኙነት (MONGO_URI በ Render Environment ውስጥ መኖሩን አረጋግጪ)
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('በተሳካ ሁኔታ ከ MongoDB Atlas ጋር ተገናኝተናል!'))
  .catch(err => console.error('የዳታቤዝ ግንኙነት ስህተት:', err));

// --- 1. የተጠቃሚዎች ሞዴል ---
const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }
});
const User = mongoose.model('User', UserSchema);

// --- 2. የምርቶች ሞዴል ---
const ProductSchema = new mongoose.Schema({
  title: String,
  price: Number,
  description: String,
  imageUrl: String,
  seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
});
const Product = mongoose.model('Product', ProductSchema);

// --- 3. መንገዶች (Routes) ---

// መፈተሻ (Health Check)
app.get('/', (req, res) => res.send('Ethio-Market API እየሰራ ነው!'));

// የምዝገባ መንገድ (Signup)
app.post('/api/signup', async (req, res) => {
  try {
    const { email, password } = req.body;
    const newUser = new User({ email, password });
    await newUser.save();
    res.status(201).json({ message: "ተጠቃሚው በተሳካ ሁኔታ ተመዝግቧል!" });
  } catch (err) {
    res.status(400).json({ message: "ምዝገባው አልተሳካም: " + err.message });
  }
});

// የሎጊን መንገድ (Login)
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email, password });
    if (user) {
      res.json({ message: "እንኳን ደህና መጡ!", user: { id: user._id, email: user.email } });
    } else {
      res.status(401).json({ message: "የገቡት መረጃ ትክክል አይደለም።" });
    }
  } catch (err) {
    res.status(500).json({ message: "የሰርቨር ስህተት አጋጥሟል" });
  }
});

// ምርቶችን የማምጣት መንገድ (Get Products)
app.get('/api/products', async (req, res) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: "ምርቶችን ማግኘት አልተቻለም" });
  }
});

// ምርት የመመዝገቢያ መንገድ (Add Product)
app.post('/api/products', async (req, res) => {
  try {
    const newProduct = new Product(req.body);
    await newProduct.save();
    res.status(201).json(newProduct);
  } catch (err) {
    res.status(400).json({ message: "ምርቱን መመዝገብ አልተቻለም" });
  }
});

// አዲስ የመጣው - ምርትን የማጥፊያ መንገድ (Delete Product)
app.delete('/api/products/:id', async (req, res) => {
  try {
    const deletedProduct = await Product.findByIdAndDelete(req.params.id);
    if (deletedProduct) {
      res.json({ message: "ምርቱ በተሳካ ሁኔታ ተሰርዟል!" });
    } else {
      res.status(404).json({ message: "ምርቱ አልተገኘም" });
    }
  } catch (err) {
    res.status(500).json({ message: "ምርቱን ማጥፋት አልተቻለም" });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`ሰርቨሩ በፖርት ${PORT} ላይ ስራ ጀምሯል`));
