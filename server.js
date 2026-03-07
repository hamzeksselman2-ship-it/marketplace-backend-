const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();
const app = express();
app.use(express.json({ limit: '50mb' }));
app.use(cors({ origin: '*', credentials: true }));

mongoose.connect(process.env.MONGO_URI).then(() => console.log('Connected to MongoDB Atlas!'));

// ሞዴሎች
const User = mongoose.model('User', new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }
}));

const Product = mongoose.model('Product', new mongoose.Schema({
  title: String, price: Number, description: String, imageUrl: String, phone: String,
  seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}));

const Message = mongoose.model('Message', new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  sender: String, receiver: String, text: String, createdAt: { type: Date, default: Date.now }
}));

// Routes
app.post('/api/signup', async (req, res) => {
  const user = new User(req.body); await user.save();
  res.status(201).json({ message: "Success" });
});

app.post('/api/login', async (req, res) => {
  const user = await User.findOne(req.body);
  if (user) res.json({ user: { id: user._id, email: user.email } });
  else res.status(401).send("Error");
});

app.get('/api/products', async (req, res) => res.json(await Product.find()));

app.post('/api/products', async (req, res) => {
  const product = new Product(req.body); await product.save();
  res.status(201).json(product);
});

// የቻት መልዕክት መላኪያ
app.post('/api/messages', async (req, res) => {
  const msg = new Message(req.body); await msg.save();
  res.status(201).json(msg);
});

// የቻት መልዕክቶችን ማግኛ
app.get('/api/messages/:userId', async (req, res) => {
  const msgs = await Message.find({ $or: [{ sender: req.params.userId }, { receiver: req.params.userId }] });
  res.json(msgs);
});

app.listen(process.env.PORT || 5000);
