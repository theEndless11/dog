const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const multer = require('multer');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from .env file
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());

// Set up file upload (for media files like images/videos)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage });

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected successfully'))
  .catch((err) => console.log('Error connecting to MongoDB:', err));

// Define Mongoose Models
const Message = mongoose.model('Message', new mongoose.Schema({
  user: { type: String, required: true },
  text: { type: String },
  file: { type: String }, // URL to the file
  time: { type: Date, default: Date.now },
  isPrivate: { type: Boolean, default: false },
  toUser: { type: String }, // Private message recipient
}));

// Route to send a message (public or private)
app.post('/send-message', upload.single('file'), async (req, res) => {
  const { user, text, toUser, isPrivate } = req.body;
  const file = req.file ? `/uploads/${req.file.filename}` : null;

  // Logging for debugging to make sure the data is being received correctly
  console.log('Received message data:', { user, text, toUser, isPrivate, file });

  try {
    const message = new Message({
      user,
      text,
      file,
      isPrivate,
      toUser,
    });

    // Saving the message to the database
    await message.save();

    // If successful, log the success and send a response
    console.log('Message saved to DB');
    res.status(200).send({ message: 'Message sent successfully!' });
  } catch (error) {
    // If an error occurs, log it and send the error response
    console.log('Error sending message:', error);
    res.status(500).send({ message: 'Error sending message', error });
  }
});

// Route to get all messages (or filtered messages based on user)
app.get('/messages', async (req, res) => {
  const { username } = req.query; // We can pass the `username` as a query parameter to filter messages

  try {
    let messages;

    if (username) {
      // If a username is provided, filter messages for that user (both public and private)
      messages = await Message.find({
        $or: [{ isPrivate: false }, { toUser: username }],
      }).sort({ time: 1 });
    } else {
      // If no username is provided, return all messages (for admin or public view)
      messages = await Message.find().sort({ time: 1 });
    }

    // Return the fetched messages in the response
    res.json(messages);
  } catch (error) {
    // If an error occurs, log it and send the error response
    console.log('Error fetching messages:', error);
    res.status(500).send({ message: 'Error fetching messages', error });
  }
});

// Serve static files (e.g., images, videos, etc.)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Start the server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

