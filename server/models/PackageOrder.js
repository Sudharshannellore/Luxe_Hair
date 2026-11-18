const mongoose = require("mongoose");
const reviewSchema = require("./review");

const orderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    package: { type: mongoose.Schema.Types.ObjectId, ref: "Package", required: true },
    orderDate: { type: Date, default: Date.now },
    expiryDate: { type: Date, default: () => new Date(Date.now() + 30 * 86400000) },
    status: { type: String, enum: ["active", "expired", "cancelled"], default: "active" },
    expiryReminderSent: { type: Boolean, default: false },

    price: { type: Number },
    couponCode: { type: String },
    discount: { type: Number, default: 0 },
    finalPrice: { type: Number },

    paymentMethod: { type: String, enum: ["cod", "online"], required: true },
    paymentStatus: { type: String, enum: ["pending", "paid", "failed", "refunded"], default: "pending" },
    paymentRef: { type: String }, // demo checkout reference
    transactionId: { type: String }, // set when the demo payment is confirmed
    paymentInstrument: { type: String }, // e.g. "Visa •••• 4242" or "UPI ann@okbank"

    servicesUsed: {
      type: [
        {
          serviceName: { type: String, required: true },
          used: { type: Boolean, default: false },
          usedAt: { type: Date, default: null },
          assignedStaff: { type: mongoose.Schema.Types.ObjectId, ref: "Staff", default: null },
        },
      ],
      default: [],
    },
    reviews: { type: [reviewSchema], default: [] },
  },
  { timestamps: true }
);

orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ status: 1, expiryDate: 1 });
orderSchema.index({ paymentRef: 1 }, { sparse: true });

// Copy the package's service list into servicesUsed when an order is created.
orderSchema.pre("save", async function seedServices() {
  if (!this.isNew || this.servicesUsed.length) return;
  const pkg = await mongoose.model("Package").findById(this.package).select("services").lean();
  if (pkg?.services?.length) {
    this.servicesUsed = pkg.services.map((serviceName) => ({ serviceName }));
  }
});

module.exports = mongoose.model("PackageOrder", orderSchema);
