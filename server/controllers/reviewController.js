const PackageOrder = require('../models/PackageOrder')
const ServiceBooking = require ('../models/ServiceBooking')

// Add review to a Package
exports.addPackageReview = async (req, res) => {
  try {
    const { comment, rating } = req.body;
    const package = await PackageOrder.findById(req.params.id);

    if (!package) return res.status(404).json({ message: "Order not found" });

    const review = {
      user: req.userId, // authentication and req.user is set
      comment,
      rating
    };

    package.reviews.push(review);
    await package.save();

    res.status(201).json({ message: "Review added", package });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// Get current user's review for a package
exports.getPackageReview = async (req, res) => {
  try {
    const { id } = req.params; // service ID
    const package = await PackageOrder.findById(id);

    if (!package) return res.status(404).json({ message: "Order not found" });

    // Find the review by the logged-in user
    const review = package.reviews.find(r => r.user.toString() === req.userId);

    if (!review) return res.status(200).json({ rating: 0, comment: "" }); // no review yet

    res.status(200).json({ rating: review.rating, comment: review.comment });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// Add review to a service
exports.addServiceReview = async (req, res) => {
  try {
    const { comment, rating } = req.body;
    const service = await ServiceBooking.findById(req.params.id);

    if (!service) return res.status(404).json({ message: "Service not found" });

    const review = {
      user: req.userId, // authentication and req.user is set
      comment,
      rating
    };

    service.reviews.push(review);
    await service.save();

    res.status(201).json({ message: "Review added", service });
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: "Server error" });
  }
};

// Get current user's review for a service
exports.getServiceReview = async (req, res) => {
  try {
    const { id } = req.params; // service ID
    const service = await ServiceBooking.findById(id);

    if (!service) return res.status(404).json({ message: "Service not found" });

    // Find the review by the logged-in user
    const review = service.reviews.find(r => r.user.toString() === req.userId);

    if (!review) return res.status(200).json({ rating: 0, comment: "" }); // no review yet

    res.status(200).json({ rating: review.rating, comment: review.comment });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};


exports.getAllReviewsSeparated = async (req, res) => {
  try {
    // Get all bookings and orders with populated user info
    const serviceBookings = await ServiceBooking.find()
      .populate("reviews.user", "username image")
      .populate("service", "title"); // to show service title

    const packageOrders = await PackageOrder.find()
      .populate("reviews.user", "username image")
      .populate("package", "title"); // to show package title

    // Format reviews from service bookings
    const serviceBookingReviews = serviceBookings.flatMap(booking =>
      booking.reviews.map(r => ({
        bookingId: booking._id,
        serviceId: booking.service?._id,
        serviceTitle: booking.service?.title,
        username: r.user?.username,
        userImage: r.user?.image,
        comment: r.comment,
        rating: r.rating,
        createdAt: booking.createdAt
      }))
    );

    // Format reviews from package orders
    const packageOrderReviews = packageOrders.flatMap(order =>
      order.reviews.map(r => ({
        orderId: order._id,
        packageId: order.package?._id,
        packageTitle: order.package?.title,
        username: r.user?.username,
        userImage: r.user?.image,
        comment: r.comment,
        rating: r.rating,
        createdAt: order.createdAt
      }))
    );

    res.json({
      totalServiceBookingReviews: serviceBookingReviews.length,
      totalPackageOrderReviews: packageOrderReviews.length,
      serviceBookingReviews,
      packageOrderReviews
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};