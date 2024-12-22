"use strict";

var express = require('express');

var mongoose = require('mongoose');

var bodyParser = require('body-parser');

var multer = require('multer');

var dotenv = require('dotenv');

var path = require('path'); // Load environment variables from .env file


dotenv.config();
var app = express();
var port = process.env.PORT || 3000; // Middleware

app.use(bodyParser.json()); // Set up file upload (for media files like images/videos)

var storage = multer.diskStorage({
  destination: function destination(req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function filename(req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
var upload = multer({
  storage: storage
}); // MongoDB Connection

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(function () {
  return console.log('MongoDB connected successfully');
})["catch"](function (err) {
  return console.log('Error connecting to MongoDB:', err);
}); // Define Mongoose Models

var Message = mongoose.model('Message', new mongoose.Schema({
  user: {
    type: String,
    required: true
  },
  text: {
    type: String
  },
  file: {
    type: String
  },
  // URL to the file
  time: {
    type: Date,
    "default": Date.now
  },
  isPrivate: {
    type: Boolean,
    "default": false
  },
  toUser: {
    type: String
  } // Private message recipient

})); // Route to send a message (public or private)

app.post('/send-message', upload.single('file'), function _callee(req, res) {
  var _req$body, user, text, toUser, isPrivate, file, message;

  return regeneratorRuntime.async(function _callee$(_context) {
    while (1) {
      switch (_context.prev = _context.next) {
        case 0:
          _req$body = req.body, user = _req$body.user, text = _req$body.text, toUser = _req$body.toUser, isPrivate = _req$body.isPrivate;
          file = req.file ? "/uploads/".concat(req.file.filename) : null; // Logging for debugging to make sure the data is being received correctly

          console.log('Received message data:', {
            user: user,
            text: text,
            toUser: toUser,
            isPrivate: isPrivate,
            file: file
          });
          _context.prev = 3;
          message = new Message({
            user: user,
            text: text,
            file: file,
            isPrivate: isPrivate,
            toUser: toUser
          }); // Saving the message to the database

          _context.next = 7;
          return regeneratorRuntime.awrap(message.save());

        case 7:
          // If successful, log the success and send a response
          console.log('Message saved to DB');
          res.status(200).send({
            message: 'Message sent successfully!'
          });
          _context.next = 15;
          break;

        case 11:
          _context.prev = 11;
          _context.t0 = _context["catch"](3);
          // If an error occurs, log it and send the error response
          console.log('Error sending message:', _context.t0);
          res.status(500).send({
            message: 'Error sending message',
            error: _context.t0
          });

        case 15:
        case "end":
          return _context.stop();
      }
    }
  }, null, null, [[3, 11]]);
}); // Route to get all messages (or filtered messages based on user)

app.get('/messages', function _callee2(req, res) {
  var username, messages;
  return regeneratorRuntime.async(function _callee2$(_context2) {
    while (1) {
      switch (_context2.prev = _context2.next) {
        case 0:
          username = req.query.username; // We can pass the `username` as a query parameter to filter messages

          _context2.prev = 1;

          if (!username) {
            _context2.next = 8;
            break;
          }

          _context2.next = 5;
          return regeneratorRuntime.awrap(Message.find({
            $or: [{
              isPrivate: false
            }, {
              toUser: username
            }]
          }).sort({
            time: 1
          }));

        case 5:
          messages = _context2.sent;
          _context2.next = 11;
          break;

        case 8:
          _context2.next = 10;
          return regeneratorRuntime.awrap(Message.find().sort({
            time: 1
          }));

        case 10:
          messages = _context2.sent;

        case 11:
          // Return the fetched messages in the response
          res.json(messages);
          _context2.next = 18;
          break;

        case 14:
          _context2.prev = 14;
          _context2.t0 = _context2["catch"](1);
          // If an error occurs, log it and send the error response
          console.log('Error fetching messages:', _context2.t0);
          res.status(500).send({
            message: 'Error fetching messages',
            error: _context2.t0
          });

        case 18:
        case "end":
          return _context2.stop();
      }
    }
  }, null, null, [[1, 14]]);
}); // Serve static files (e.g., images, videos, etc.)

app.use('/uploads', express["static"](path.join(__dirname, 'uploads'))); // Start the server

app.listen(port, function () {
  console.log("Server running on port ".concat(port));
});
//# sourceMappingURL=server.dev.js.map
