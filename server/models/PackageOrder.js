const mongoose = require("mongoose");
const moment = require("moment");

const orderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    package: { type: mongoose.Schema.Types.ObjectId, ref: "Package", required: true },
    orderDate: { type: Date, default: Date.now },
    couponCode: {type:String},
    discount: {type:Number},
    finalPrice:{type:Number},
    expiryDate: {
      type: Date,
      default: () => moment().add(30, "days").toDate(),
    },

    // payment info
    paymentMethod: {
      type: String,
      enum: ["cod", "online"], // cash on delivery or online
      required: true
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid"],
      default: "pending"
    },

    servicesUsed: {
      type: [
        {
          serviceName: { type: String, required: true },
          used: { type: Boolean, default: false },
          usedAt: { type: Date, default: null },
          assignedStaff: { type: mongoose.Schema.Types.ObjectId, ref: "Staff", default: null }
        }
      ],
      default: []
    },
    reviews: {
      type: [
        {
          user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
          comment: { type: String, required: true },
          rating: { type: Number, min: 1, max: 5, required: true }
        }
      ],
      default: []
    }
  },
  { timestamps: true }
);

// Auto-populate servicesUsed when order is new
orderSchema.pre("save", async function (next) {
  if (this.isNew) {
    const Package = mongoose.model("Package");
    const pkg = await Package.findById(this.package);

    if (pkg && pkg.services.length > 0) {
      this.servicesUsed = pkg.services.map(svc => ({
        serviceName: svc,
        used: false,
        usedAt: null,
        assignedStaff: null
      }));
    }
  }
  next();
});

module.exports = mongoose.model("PackageOrder", orderSchema);
