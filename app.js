const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const notesRoute = require('./routes/notesRoute');
const authRoute = require('./routes/authRoute');
const otpRoute = require('./routes/otpRoute');
const signupRoute = require('./routes/signupRoute'); // ✅ Add this





const paymentRoutes = require('./routes/payment');


const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/notes', notesRoute);
app.use('/api/auth', authRoute);
app.use('/api/payment', paymentRoutes);
app.use('/api', otpRoute); // NOT /api/send-otp/send-otp — just one level
app.use('/api/signup', signupRoute); // ✅ Use this route
app.use('/api', signupRoute); // ✅ This enables /api/signup



// Auto-create uploads folder
const uploadsPath = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsPath)) {
  fs.mkdirSync(uploadsPath);
  console.log('📁 uploads/ folder created automatically.');
}

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
