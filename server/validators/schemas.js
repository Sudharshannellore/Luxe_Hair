const { z } = require("zod");
const { TIME_SLOTS } = require("../utils/slots");

// ---------- helpers ----------
const objectId = z.string().regex(/^[a-f\d]{24}$/i, { error: "Invalid id" });
const text = (min = 1, max = 200) => z.string().trim().min(min).max(max);
const money = z.coerce.number().min(0);

// Arrays may arrive as real arrays (JSON body), JSON strings or comma lists (multipart forms).
const stringArray = z.preprocess((v) => {
  if (v === undefined || v === null || v === "") return undefined;
  if (Array.isArray(v)) return v;
  if (typeof v === "string") {
    try {
      const parsed = JSON.parse(v);
      return Array.isArray(parsed) ? parsed : [String(parsed)];
    } catch {
      return v.split(",").map((s) => s.trim()).filter(Boolean);
    }
  }
  return v;
}, z.array(z.string().trim().min(1).max(200)).max(50).optional());

const optionalNumber = z.preprocess((v) => (v === "" || v === null ? undefined : v), z.coerce.number().min(0).optional());

// ---------- users / admin ----------
const register = z.object({
  username: text(2, 60),
  email: z.email().trim().toLowerCase(),
  password: z.string().min(6, { error: "Password must be at least 6 characters" }).max(100),
  phone: z.string().trim().max(20).optional(),
});

const login = z.object({
  email: z.email().trim().toLowerCase(),
  password: z.string().min(1).max(100),
});

const updateUser = z.object({
  username: text(2, 60).optional(),
  email: z.email().trim().toLowerCase().optional(),
  phone: z.string().trim().max(20).optional(),
  password: z.string().min(6, { error: "Password must be at least 6 characters" }).max(100).optional().or(z.literal("")),
});

// ---------- catalogue ----------
const service = z.object({
  title: text(2, 120),
  category: text(2, 60),
  price: money,
  duration: text(1, 40),
  description: text(5, 3000),
  benefits: stringArray,
});

const pkg = z.object({
  title: text(2, 120),
  subtitle: text(2, 300),
  price: money,
  services: stringArray,
  features: stringArray,
  validityDays: z.coerce.number().int().min(1).max(365).optional(),
});

const article = z.object({
  title: text(2, 200),
  context: text(2, 500),
  content: text(10, 50000),
  tags: stringArray,
});

const staff = z.object({
  name: text(2, 80),
  email: z.email().trim().toLowerCase(),
  phone: text(7, 20),
  experience: text(1, 40),
  specialization: text(2, 120),
  address: text(2, 300),
  status: z.enum(["active", "inactive"]).optional(),
});

const couponBase = z.object({
    offerName: text(2, 120),
    description: z.string().trim().max(300).optional(),
    couponCode: z
      .string()
      .trim()
      .toUpperCase()
      .regex(/^[A-Z0-9_-]{3,20}$/, { error: "Use 3–20 letters, numbers, - or _" }),
    discountType: z.enum(["PERCENTAGE", "FLAT"]),
    discountValue: z.coerce.number().positive(),
    // null clears the cap when editing
    maxDiscount: z.preprocess((v) => (v === "" ? null : v), z.union([z.null(), z.coerce.number().min(0)]).optional()),
    minOrderValue: optionalNumber,
    validityStart: z.coerce.date(),
    validityEnd: z.coerce.date(),
    eligibility: z.enum(["NEW_USERS", "INACTIVE_USERS", "ALL_USERS"]).optional(),
    usageLimit: z.enum(["ONCE_PER_USER", "UNLIMITED"]).optional(),
    status: z.enum(["ACTIVE", "EXPIRED", "DISABLED"]).optional(),
});

const coupon = couponBase
  .refine((c) => c.validityEnd > c.validityStart, { error: "End date must be after start date", path: ["validityEnd"] })
  .refine((c) => c.discountType !== "PERCENTAGE" || c.discountValue <= 100, {
    error: "Percentage discount cannot exceed 100",
    path: ["discountValue"],
  });

// Partial coupon updates skip the cross-field refinements (checked in the controller).
const couponUpdate = couponBase.partial();

const applyCoupon = z
  .object({
    code: text(1, 40),
    serviceId: objectId.optional(),
    packageId: objectId.optional(),
    orderValue: z.coerce.number().positive().optional(),
  })
  .refine((v) => v.serviceId || v.packageId || v.orderValue, { error: "serviceId, packageId or orderValue is required" });

// ---------- bookings / orders ----------
const createBooking = z.object({
  serviceId: objectId,
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { error: "Pick a valid date" }),
  timeSlot: z.enum(TIME_SLOTS, { error: "Pick a valid time slot" }),
  paymentMethod: z.enum(["cod", "online"]),
  couponCode: z.string().trim().max(40).optional().or(z.literal("")),
});

const createOrder = z.object({
  packageId: objectId,
  paymentMethod: z.enum(["cod", "online"]),
  couponCode: z.string().trim().max(40).optional().or(z.literal("")),
});

const bookingStatus = z.object({ status: z.enum(["pending", "confirmed", "completed", "cancelled"]) });
const paymentStatus = z.object({ paymentStatus: z.enum(["pending", "paid", "refunded"]) });
const assignBookingStaff = z.object({ bookingId: objectId, staffId: objectId });
const assignOrderStaff = z.object({ orderId: objectId, serviceName: text(1, 200), staffId: objectId });
const useService = z.object({ orderId: objectId, serviceName: text(1, 200) });

const confirmPayment = z.object({
  type: z.enum(["booking", "order"]),
  id: objectId,
  reference: text(1, 60),
  // What the customer "paid" with in the demo checkout, e.g. "Visa •••• 4242" / "UPI ann@okbank"
  instrument: z.string().trim().max(60).optional(),
});

const cancelPayment = z.object({ type: z.enum(["booking", "order"]), id: objectId });

// ---------- misc ----------
const review = z.object({
  rating: z.coerce.number().int().min(1).max(5),
  comment: z.string().trim().max(1000).optional().default(""),
});

const message = z.object({
  fullname: text(2, 80),
  email: z.email().trim().toLowerCase(),
  phone: z.string().trim().regex(/^[+\d][\d\s-]{6,18}$/, { error: "Enter a valid phone number" }),
  message: text(5, 2000),
});

const paymentSettings = z.object({
  online: z.boolean().optional(),
  cod: z.boolean().optional(),
});

module.exports = {
  register,
  login,
  updateUser,
  service,
  serviceUpdate: service.partial(),
  pkg,
  pkgUpdate: pkg.partial(),
  article,
  articleUpdate: article.partial(),
  staff,
  staffUpdate: staff.partial(),
  coupon,
  couponUpdate,
  applyCoupon,
  createBooking,
  createOrder,
  bookingStatus,
  paymentStatus,
  assignBookingStaff,
  assignOrderStaff,
  useService,
  confirmPayment,
  cancelPayment,
  review,
  message,
  paymentSettings,
};
