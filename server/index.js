const express = require('express')
const dotenv = require("dotenv");
const cors = require('cors');
const mongoose = require('mongoose')
const path = require("path");
const userRoute = require('./routes/userRoutes');
const serviceRoute = require('./routes/serviceRoutes');
const packageRoute = require('./routes/packageRoutes')
const serviceBookingRoute = require('./routes/serviceBookingRoutes')
const packageOrderRoute = require('./routes/packageOrderRoute')
const dashboardRoute = require('./routes/dashboardRoute')
const staffRoutes = require('./routes/staffRoutes')
const reviewRoutes = require("./routes/reviewRoute")
const messageRoute = require('./routes/messageRoutes')
const paymentRoutes = require('./routes/paymentSettingRoute');
const articleRoutes = require('./routes/articleRoutes')
const couponRoutes = require('./routes/couponRoute')

dotenv.config();

const app = express()
app.use(cors());
app.use(express.json()); 
app.use(express.urlencoded({ extended: true }));

// Database Connection
mongoose.connect(process.env.MONGO_URL)
.then(() => console.log("MongoDB Successfully Connected"))
.catch((error) => console.error("MongoDB connection error:", error));

// Serve uploaded files (publicly accessible)
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Routes
app.use('/user', userRoute);
app.use('/service', serviceRoute);
app.use('/package', packageRoute);
app.use('/booking', serviceBookingRoute)
app.use('/order', packageOrderRoute);
app.use('/dashboard', dashboardRoute);
app.use('/staff', staffRoutes);
app.use('/review', reviewRoutes);
app.use('/message', messageRoute);
app.use('/payment', paymentRoutes);
app.use('/article', articleRoutes)
app.use('/coupon', couponRoutes);

const port = process.env.PORT || 5000;

app.get('/', (req, res) => res.send('Hello World!'))
app.listen(port, () => console.log(`Server Running on port ${port}!`))