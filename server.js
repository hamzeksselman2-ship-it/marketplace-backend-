const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();
const app = express();

// የፋይል መጠንን ለመጨመር (ለፎቶዎች)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// የ CORS ፈቃድ - ለሁሉም እንዲሰራ ( origin: '*' )
app.use(cors({ origin: '*', credentials: true }));

// የዳታቤዝ ግንኙነት
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('በተሳካ ሁኔታ ከ MongoDB Atlas ጋር ተገናኝተናል!'))
  .catch(err => console.error('የዳታቤዝ ግንኙነት ስህተት:', err));

// --- ሞዴሎች (Schemas) ---
const User = mongoose.model('User', new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }
}));

const Product = mongoose.model('Product', new mongoose.Schema({
  title: String,
  price: Number,
  description: String,
  imageUrl: String,
  phone: String,
  seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}));

const Message = mongoose.model('Message', new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  sender: String, // የላኪው ኢሜል
  receiver: String, // የተቀባዩ (የሻጩ) ኢሜል
  text: String,
  createdAt: { type: Date, default: Date.now }
}));

// --- መንገዶች (Routes) ---

app.get('/', (req, res) => res.send('Ethio-Market API Live!'));

// 1. ምዝገባ እና ሎጊን
app.post('/api/signup', async (req, res) => {
  try {
    const user = new User(req.body);
    await user.save();
    res.status(201).json({ message: "Success" });
  } catch (err) { res.status(400).send(err.message); }
});

app.post('/api/login', async (req, res) => {
  const user = await User.findOne({ email: req.body.email, password: req.body.password });
  if (user) res.json({ user: { id: user._id, email: user.email } });
  else res.status(401).json({ message: "Error" });
});

// 2. የምርቶች ስራ (Get, Add, Edit, Delete)
app.get('/api/products', async (req, res) => {
  const products = await Product.find();
  res.json(products);
});

app.post('/api/products', async (req, res) => {
  try {
    const product = new Product(req.body);
    await product.save();
    res.status(201).json(product);
  } catch (err) { res.status(400).send(err.message); }
});

// አዲስ የመጣ - ማስተካከያ (Edit)
app.put('/api/products/:id', async (req, res) => {
  try {
    const updated = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (err) { res.status(400).send(err.message); }
});

app.delete('/api/products/:id', async (req, res) => {
  await Product.findByIdAndDelete(req.params.id);
  res.json({ message: "Deleted" });
});

// 3. የቻት እና የኢንቦክስ ስራ (Messaging)
app.post('/api/messages', async (req, res) => {
  try {
    const msg = new Message(req.body);
    await msg.save();
    res.status(201).json(msg);
  } catch (err) { res.status(400).send(err.message); }
});

// ኢንቦክስ ማግኛ (Inbox)
app.get('/api/inbox/:userEmail', async (req, res) => {
  try {
    const messages = await Message.find({ 
      $or: [{ sender: req.params.userEmail }, { receiver: req.params.userEmail }] 
    }).sort({ createdAt: -1 });
    res.json(messages);
  } catch (err) { res.status(500).send(err.message); }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`ሰርቨር ተነስቷል በ ${PORT}`));
