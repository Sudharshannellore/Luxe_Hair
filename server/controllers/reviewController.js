const PackageOrder = require("../models/PackageOrder");
const ServiceBooking = require("../models/ServiceBooking");
const { httpError } = require("../utils/httpError");

// One review per user per booking/order; submitting again updates it.
const upsertReview = (doc, userId, { rating, comment }) => {
  const existing = doc.reviews.find((r) => String(r.user) === String(userId));
  if (existing) {
    existing.rating = rating;
    existing.comment = comment;
  } else {
    doc.reviews.push({ user: userId, rating, comment });
  }
};

const myReview = (doc, userId) => {
  const review = doc.reviews.find((r) => String(r.user) === String(userId));
  return review ? { rating: review.rating, comment: review.comment } : { rating: 0, comment: "" };
};

// ================== CUSTOMER ==================

exports.addServiceReview = async (req, res) => {
  const booking = await ServiceBooking.findOne({ _id: req.params.id, user: req.userId });
  if (!booking) throw httpError(404, "Booking not found");
  if (booking.status !== "completed") throw httpError(400, "You can leave a review once your appointment is completed.");
  upsertReview(booking, req.userId, req.body);
  await booking.save();
  res.status(201).json({ message: "Thanks for your review!", review: myReview(booking, req.userId) });
};

exports.getServiceReview = async (req, res) => {
  const booking = await ServiceBooking.findOne({ _id: req.params.id, user: req.userId }).select("reviews");
  if (!booking) throw httpError(404, "Booking not found");
  res.json(myReview(booking, req.userId));
};

exports.addPackageReview = async (req, res) => {
  const order = await PackageOrder.findOne({ _id: req.params.id, user: req.userId });
  if (!order) throw httpError(404, "Order not found");
  if (!order.servicesUsed.some((s) => s.used)) {
    throw httpError(400, "You can review this combo after using at least one of its services.");
  }
  upsertReview(order, req.userId, req.body);
  await order.save();
  res.status(201).json({ message: "Thanks for your review!", review: myReview(order, req.userId) });
};

exports.getPackageReview = async (req, res) => {
  const order = await PackageOrder.findOne({ _id: req.params.id, user: req.userId }).select("reviews");
  if (!order) throw httpError(404, "Order not found");
  res.json(myReview(order, req.userId));
};

// ================== PUBLIC ==================

// Recent 4–5 star reviews with a comment, for the website testimonials.
exports.getPublicReviews = async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 9, 24);
  const withReviews = { "reviews.0": { $exists: true } };

  const [bookings, orders] = await Promise.all([
    ServiceBooking.find(withReviews).sort({ updatedAt: -1 }).limit(60).populate("reviews.user", "username image").populate("service", "title").lean(),
    PackageOrder.find(withReviews).sort({ updatedAt: -1 }).limit(60).populate("reviews.user", "username image").populate("package", "title").lean(),
  ]);

  const toPublic = (doc, title) =>
    doc.reviews
      .filter((r) => r.rating >= 4 && r.comment?.trim() && r.user)
      .map((r) => ({
        _id: r._id,
        username: r.user.username,
        userImage: r.user.image,
        rating: r.rating,
        comment: r.comment,
        about: title,
        createdAt: r.createdAt || doc.updatedAt,
      }));

  const reviews = [
    ...bookings.flatMap((b) => toPublic(b, b.service?.title)),
    ...orders.flatMap((o) => toPublic(o, o.package?.title)),
  ]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, limit);

  res.json(reviews);
};

// ================== ADMIN ==================

exports.getAllReviewsSeparated = async (req, res) => {
  const withReviews = { "reviews.0": { $exists: true } };
  const [serviceBookings, packageOrders] = await Promise.all([
    ServiceBooking.find(withReviews).populate("reviews.user", "username image email").populate("service", "title").lean(),
    PackageOrder.find(withReviews).populate("reviews.user", "username image email").populate("package", "title").lean(),
  ]);

  const map = (doc, extra) =>
    doc.reviews.map((r) => ({
      reviewId: r._id,
      username: r.user?.username || "Deleted user",
      userEmail: r.user?.email,
      userImage: r.user?.image,
      comment: r.comment,
      rating: r.rating,
      createdAt: r.createdAt || doc.updatedAt,
      ...extra,
    }));

  const serviceBookingReviews = serviceBookings.flatMap((b) =>
    map(b, { bookingId: b._id, serviceId: b.service?._id, serviceTitle: b.service?.title })
  );
  const packageOrderReviews = packageOrders.flatMap((o) =>
    map(o, { orderId: o._id, packageId: o.package?._id, packageTitle: o.package?.title })
  );

  res.json({
    totalServiceBookingReviews: serviceBookingReviews.length,
    totalPackageOrderReviews: packageOrderReviews.length,
    serviceBookingReviews,
    packageOrderReviews,
  });
};

// DELETE /review/:type/:docId/:reviewId  (type = service | package) — moderation
exports.deleteReview = async (req, res) => {
  const { type, docId, reviewId } = req.params;
  const Model = type === "service" ? ServiceBooking : type === "package" ? PackageOrder : null;
  if (!Model) throw httpError(400, "type must be service or package");
  const result = await Model.updateOne({ _id: docId }, { $pull: { reviews: { _id: reviewId } } });
  if (!result.modifiedCount) throw httpError(404, "Review not found");
  res.json({ message: "Review removed" });
};
