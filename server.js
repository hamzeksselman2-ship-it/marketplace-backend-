const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();
const app = express();

// የፎቶ ፋይል መጠንን ለመጨመር (እስከ 50mb ፋይል እንዲቀበል)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

app.use(cors({
  origin: ['https://hamza-ethio-market.netlify.app', 'https://marketplace-frontend-final.vercel.app'],
  credentials: true
}));

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('በተሳካ ሁኔታ ከ MongoDB Atlas ጋር ተገናኝተናል!'))
  .catch(err => console.error('የዳታቤዝ ግንኙነት ስህተት:', err));

const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }
});
const User = mongoose.model('User', UserSchema);

const ProductSchema = new mongoose.Schema({
  title: String,
  price: Number,
  description: String,
  imageUrl: String, // እዚህ ጋር የፎቶው ሊንክ ይቀመጣል
  seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
});
const Product = mongoose.model('Product', ProductSchema);

// Routes... (ሎጊን እና ሲግን አፕ እንዳሉ ናቸው)
app.get('/', (req, res) => res.send('Ethio-Market API Live!'));

app.post('/api/signup', async (req, res) => {
  try {
    const { email, password } = req.body;
    const newUser = new User({ email, password });
    await newUser.save();
    res.status(201).json({ message: "ተሳክቷል!" });
  } catch (err) { res.status(400).send(err.message); }
});

app.post('/api/login', async (req, res) => {
  const user = await User.findOne({ email: req.body.email, password: req.body.password });
  if (user) res.json({ user: { id: user._id, email: user.email } });
  else res.status(401).send("ስህተት");
});

app.get('/api/products', async (req, res) => {
  const products = await Product.find();
  res.json(products);
});

// ምርት መመዝገቢያ - ምስሉን ጨምሮ
app.post('/api/products', async (req, res) => {
  try {
    const newProduct = new Product(req.body);
    await newProduct.save();
    res.status(201).json(newProduct);
  } catch (err) { res.status(400).send(err.message); }
});

app.delete('/api/products/:id', async (req, res) => {
  await Product.findByIdAndDelete(req.params.id);
  res.json({ message: "ጠፍቷል" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`ሰርቨር ተነስቷል`));
