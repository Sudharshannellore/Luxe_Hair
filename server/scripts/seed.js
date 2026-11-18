/**
 * Seeds the database with a realistic Luxe Hair catalogue and demo activity.
 *
 *   npm run seed            -> catalogue (services, combos, staff, articles, coupons, settings)
 *                              + demo customers, bookings, combo orders, reviews and messages
 *   npm run seed -- --catalogue-only   -> skip the demo customers/activity
 *
 * Safe to re-run: each collection is only seeded when it is empty, nothing is deleted.
 * Images are hosted Pexels photos (free to use), stored as full URLs.
 * Demo customers sign in with password: Demo@1234
 */
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const config = require("../config");

const Service = require("../models/Service");
const Package = require("../models/Package");
const Staff = require("../models/Staff");
const Article = require("../models/Article");
const Coupon = require("../models/Coupon");
const Settings = require("../models/PaymentSettings");
const User = require("../models/User");
const Booking = require("../models/ServiceBooking");
const Order = require("../models/PackageOrder");
const Message = require("../models/Message");
const { TIME_SLOTS } = require("../utils/slots");
const { todayKey, dateKeyToDate, addDays } = require("../utils/dates");

const CATALOGUE_ONLY = process.argv.includes("--catalogue-only");
const DEMO_PASSWORD = "Demo@1234";

const px = (id, w = 1200) => `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=${w}`;

// ---------------------------------------------------------------- catalogue data

const SERVICES = [
  {
    title: "Signature Haircut & Style",
    category: "Cut & Style",
    price: 1200,
    duration: "60 min",
    image: px(3993453),
    description:
      "A consultation-led precision cut tailored to your face shape, hair texture and lifestyle, finished with a wash and a polished blow-dry.",
    benefits: ["Personal consultation", "Precision cut", "Wash & blow-dry finish"],
  },
  {
    title: "Blow-dry & Styling",
    category: "Cut & Style",
    price: 800,
    duration: "45 min",
    image: px(3993467),
    description: "Voluminous, glossy blow-dry or sleek straight finish — perfect before an event, a shoot or simply a great week.",
    benefits: ["Heat-protect treatment", "Volume or sleek finish", "Long-lasting hold"],
  },
  {
    title: "Event & Bridal Curls",
    category: "Cut & Style",
    price: 2500,
    duration: "75 min",
    image: px(3065171),
    description: "Soft Hollywood waves, romantic curls or an elegant up-do designed to last from the first photo to the last dance.",
    benefits: ["Trial-ready look", "Accessory placement", "All-day hold"],
  },
  {
    title: "Global Hair Colour",
    category: "Colour",
    price: 3500,
    duration: "120 min",
    image: px(3993320),
    description: "Rich, even, all-over colour using ammonia-free formulas, with a bond-building treatment to keep hair strong and shiny.",
    benefits: ["Ammonia-free colour", "Bond-building care", "Gloss finish"],
  },
  {
    title: "Balayage & Highlights",
    category: "Colour",
    price: 5500,
    duration: "180 min",
    image: px(3065209),
    description: "Hand-painted, sun-kissed dimension that grows out beautifully. Includes toning and a deep-conditioning mask.",
    benefits: ["Hand-painted technique", "Custom toning", "Low-maintenance grow-out"],
  },
  {
    title: "Keratin Smoothing",
    category: "Treatment",
    price: 6000,
    duration: "150 min",
    image: px(7755226),
    description: "Smooths frizz and cuts styling time in half for up to four months, while keeping natural movement and shine.",
    benefits: ["Frizz-free for months", "Faster styling", "Formaldehyde-free"],
  },
  {
    title: "Luxe Hair Spa Ritual",
    category: "Treatment",
    price: 1800,
    duration: "60 min",
    image: px(3993449),
    description: "A deeply relaxing spa ritual: double cleanse, nourishing mask under steam and a soothing head and shoulder massage.",
    benefits: ["Deep nourishment", "Steam therapy", "Stress-melting massage"],
  },
  {
    title: "Scalp Detox Therapy",
    category: "Treatment",
    price: 2200,
    duration: "50 min",
    image: px(3993444),
    description: "Exfoliates build-up, balances oil and calms the scalp — the foundation for healthier, faster-growing hair.",
    benefits: ["Removes build-up", "Balances oil", "Soothes itchiness"],
  },
  {
    title: "Anti Hair-fall Treatment",
    category: "Treatment",
    price: 2800,
    duration: "60 min",
    image: px(6663368),
    description: "A targeted serum and massage protocol that strengthens roots and reduces breakage. Best as a course of four sessions.",
    benefits: ["Strengthens roots", "Reduces breakage", "Improves density"],
  },
  {
    title: "Curl Definition Session",
    category: "Cut & Style",
    price: 1600,
    duration: "70 min",
    image: px(4153798),
    description: "A curly-specialist cut and styling lesson so your curls stay defined, bouncy and frizz-free at home.",
    benefits: ["Curl-by-curl cut", "Product guidance", "Defined, bouncy finish"],
  },
  {
    title: "Men's Grooming Cut",
    category: "Men",
    price: 700,
    duration: "40 min",
    image: px(1813272),
    description: "Clean fades, classic scissor cuts and beard shaping, finished with a hot towel and styling.",
    benefits: ["Fade or scissor cut", "Beard shaping", "Hot-towel finish"],
  },
];

const PACKAGES = [
  {
    title: "Silver Glow",
    subtitle: "A refresh for hair that needs a little love",
    price: 2800,
    image: px(3993133),
    services: ["Signature Haircut & Style", "Luxe Hair Spa Ritual"],
    features: ["Save ₹200", "Valid for 30 days", "Free fringe trim"],
    validityDays: 30,
  },
  {
    title: "Gold Ritual",
    subtitle: "Our most-loved colour and care combo",
    price: 7800,
    image: px(3992875),
    services: ["Global Hair Colour", "Luxe Hair Spa Ritual", "Scalp Detox Therapy", "Blow-dry & Styling"],
    features: ["Save ₹500", "Valid for 60 days", "Complimentary aftercare kit"],
    validityDays: 60,
  },
  {
    title: "Platinum Bridal",
    subtitle: "Everything for your big day and the weeks before it",
    price: 14500,
    image: px(3065170),
    services: ["Keratin Smoothing", "Luxe Hair Spa Ritual", "Scalp Detox Therapy", "Event & Bridal Curls", "Blow-dry & Styling"],
    features: ["Save ₹2,000", "Valid for 90 days", "Free style trial", "Priority booking"],
    validityDays: 90,
  },
];

const STAFF = [
  { name: "Ananya Rao", specialization: "Colour Expert · Balayage", experience: "9 years", image: px(1065084, 600), phone: "+91 98450 11201", address: "Indiranagar, Bengaluru" },
  { name: "Meera Kapoor", specialization: "Bridal & Event Styling", experience: "7 years", image: px(1181690, 600), phone: "+91 98450 11202", address: "Koramangala, Bengaluru" },
  { name: "Isabella D'Souza", specialization: "Keratin & Hair Treatments", experience: "6 years", image: px(733872, 600), phone: "+91 98450 11203", address: "HSR Layout, Bengaluru" },
  { name: "Arjun Menon", specialization: "Men's Grooming · Fades", experience: "8 years", image: px(2379004, 600), phone: "+91 98450 11204", address: "Jayanagar, Bengaluru" },
  { name: "Priya Nair", specialization: "Curly Hair Specialist", experience: "5 years", image: px(774909, 600), phone: "+91 98450 11205", address: "Whitefield, Bengaluru" },
].map((s) => ({ ...s, email: `${s.name.split(" ")[0].toLowerCase()}@luxehair.demo`, status: "active" }));

const ARTICLES = [
  {
    title: "5 Habits for Healthier Hair This Winter",
    context: "Cold air and hot showers are a tough combination. Here's how to keep your hair soft, strong and shiny all season.",
    tags: ["Hair care", "Winter", "Tips"],
    image: px(3993398),
    content: `Winter is beautiful, but it can be hard on your hair. Cold, dry air pulls moisture out of every strand, and hot showers strip away the natural oils that protect it.

1. Turn the water down. Rinse with lukewarm water and finish with a cool rinse to seal the cuticle and add shine.

2. Deep-condition weekly. A rich mask once a week replaces the moisture winter takes away. Leave it on for at least ten minutes.

3. Never skip heat protection. If you blow-dry more in winter, a heat protectant is non-negotiable.

4. Swap cotton for silk. A silk pillowcase reduces friction, breakage and morning frizz.

5. Book a spa ritual. A professional hair spa every four to six weeks resets your scalp and keeps ends healthy through the season.`,
  },
  {
    title: "Balayage vs Highlights: Which Is Right for You?",
    context: "Both add dimension, but they grow out very differently. Our colour expert explains how to choose.",
    tags: ["Colour", "Balayage", "Guide"],
    image: px(3065209),
    content: `Balayage and highlights both add brightness and dimension, but the technique — and the maintenance — are very different.

Highlights are applied with foils in a structured pattern from close to the root. The result is brighter, more uniform lightness, but the regrowth line shows sooner, so you'll be back every six to eight weeks.

Balayage is painted freehand, with softer placement that starts further from the root. It looks naturally sun-kissed and grows out gracefully, so many clients only refresh it every three to four months.

Choose highlights if you want maximum brightness and don't mind regular appointments. Choose balayage if you want a lived-in, low-maintenance look.

Not sure? Book a free colour consultation and we'll look at your base colour, skin tone and routine together.`,
  },
  {
    title: "What Actually Happens During a Keratin Treatment",
    context: "From consultation to the first wash — a step-by-step look at our most popular smoothing treatment.",
    tags: ["Keratin", "Treatment", "Frizz"],
    image: px(7755226),
    content: `Keratin smoothing is the single best fix for frizz — but many clients aren't sure what to expect. Here's the whole process.

Consultation. We check your hair's porosity and any previous colour, then choose the right formula strength.

Clarifying wash. A deep-cleansing shampoo opens the cuticle so the keratin can penetrate evenly.

Application. The treatment is applied section by section and combed through for full coverage.

Sealing. Hair is blow-dried and then flat-ironed in fine sections to lock the smoothing in.

Aftercare. Use sulphate-free shampoo and avoid tying your hair tightly for the first 48 hours. Results last three to four months.`,
  },
  {
    title: "The Tools Our Stylists Can't Live Without",
    context: "Behind every great cut is a great set of tools. Our team shares the essentials they reach for every day.",
    tags: ["Behind the scenes", "Tools"],
    image: px(3992870),
    content: `Ask any stylist about their tools and you'll get a passionate answer. Here are the essentials our team relies on.

Japanese steel shears. Precision blades stay sharp longer and cut cleanly, which means healthier ends for you.

A professional ionic dryer. Faster drying with less heat damage and noticeably more shine.

Wide-tooth and tail combs. The unsung heroes of sectioning, detangling and clean partings.

Quality brushes. A boar-bristle round brush for volume and a paddle brush for sleek finishes.

Great tools don't make a great stylist — but they do make a great result easier, every single time.`,
  },
  {
    title: "Caring for Coloured Red Hair",
    context: "Red is the fastest colour to fade. These simple swaps keep it vibrant for weeks longer.",
    tags: ["Colour", "Red hair", "Tips"],
    image: px(3764119),
    content: `Red pigment molecules are larger than other shades, which means they wash out faster. A few small changes make a big difference.

Wait 72 hours before your first wash so the colour can fully settle.

Use a colour-depositing conditioner once a week to top up vibrancy between visits.

Wash less often and with cooler water — heat opens the cuticle and lets colour escape.

Protect from the sun with a UV-filter spray, especially on holiday.

Book a gloss treatment every six weeks to refresh tone and shine without a full recolour.`,
  },
];

const now = new Date();
const months = (n) => new Date(now.getFullYear(), now.getMonth() + n, now.getDate());

const COUPONS = [
  {
    offerName: "Welcome Offer",
    description: "15% off your first booking with us.",
    couponCode: "WELCOME15",
    discountType: "PERCENTAGE",
    discountValue: 15,
    maxDiscount: 750,
    minOrderValue: 0,
    eligibility: "NEW_USERS",
    usageLimit: "ONCE_PER_USER",
  },
  {
    offerName: "Festive Glow",
    description: "Flat ₹300 off on bookings above ₹2,000.",
    couponCode: "FESTIVE300",
    discountType: "FLAT",
    discountValue: 300,
    minOrderValue: 2000,
    eligibility: "ALL_USERS",
    usageLimit: "UNLIMITED",
  },
  {
    offerName: "We Miss You",
    description: "20% off for clients returning after 90 days.",
    couponCode: "COMEBACK20",
    discountType: "PERCENTAGE",
    discountValue: 20,
    maxDiscount: 1000,
    minOrderValue: 1000,
    eligibility: "INACTIVE_USERS",
    usageLimit: "ONCE_PER_USER",
  },
  {
    offerName: "Combo Treat",
    description: "10% off any combo, once per client.",
    couponCode: "COMBO10",
    discountType: "PERCENTAGE",
    discountValue: 10,
    maxDiscount: 1500,
    minOrderValue: 2500,
    eligibility: "ALL_USERS",
    usageLimit: "ONCE_PER_USER",
  },
].map((c) => ({ ...c, validityStart: months(-1), validityEnd: months(6), status: "ACTIVE" }));

// ---------------------------------------------------------------- demo activity data

const CUSTOMERS = [
  { username: "Sneha Iyer", email: "sneha@luxehair.demo", phone: "+91 90000 10001", image: px(1239291, 400) },
  { username: "Kavya Sharma", email: "kavya@luxehair.demo", phone: "+91 90000 10002", image: px(1181686, 400) },
  { username: "Ritika Das", email: "ritika@luxehair.demo", phone: "+91 90000 10003", image: px(415829, 400) },
  { username: "Rahul Verma", email: "rahul@luxehair.demo", phone: "+91 90000 10004", image: px(220453, 400) },
  { username: "Aditya Kumar", email: "aditya@luxehair.demo", phone: "+91 90000 10005", image: px(1222271, 400) },
  { username: "Nisha Patel", email: "nisha@luxehair.demo", phone: "+91 90000 10006", image: px(3762800, 400) },
];

const REVIEW_TEXT = [
  [5, "Absolutely loved my balayage — it looks so natural and the team made me feel completely at ease."],
  [5, "The hair spa ritual was pure bliss. My hair has never felt this soft. Already booked my next visit!"],
  [5, "Best haircut I've had in years. Ananya really listened to what I wanted."],
  [4, "Great keratin result, my morning routine is now ten minutes. Slightly long wait at reception."],
  [5, "Clean fade, sharp beard line and a great hot-towel finish. My new regular spot."],
  [5, "Beautiful, calm studio and genuinely skilled stylists. The scalp detox made a real difference."],
  [4, "Lovely bridal trial — the curls held all day. Would recommend for any event."],
  [5, "Priya is a curl magician. Finally someone who knows how to cut curly hair!"],
];

const MESSAGES = [
  { fullname: "Lakshmi Menon", email: "lakshmi.m@example.com", phone: "+91 98111 22334", message: "Hi, do you offer bridal packages for a group of four? Wedding is in February." },
  { fullname: "Farhan Ali", email: "farhan.ali@example.com", phone: "+91 98222 33445", message: "Is parking available near the studio on weekends?" },
  { fullname: "Diya Joseph", email: "diya.j@example.com", phone: "+91 98333 44556", message: "I have very curly hair — which stylist would you recommend for a first cut?", read: true },
  { fullname: "Vikram Singh", email: "vikram.s@example.com", phone: "+91 98444 55667", message: "Do you sell the aftercare products you use during the keratin treatment?" },
];

// ---------------------------------------------------------------- helpers

const pick = (arr, i) => arr[i % arr.length];

/** Insert documents with explicit createdAt/updatedAt (bypasses automatic timestamps). */
const insertWithDates = async (Model, docs) => {
  if (!docs.length) return [];
  const prepared = docs.map(({ createdAt, ...rest }) => {
    const doc = new Model(rest);
    const err = doc.validateSync();
    if (err) throw err;
    const obj = doc.toObject({ depopulate: true });
    obj.createdAt = createdAt;
    obj.updatedAt = createdAt;
    return obj;
  });
  await Model.collection.insertMany(prepared);
  return prepared;
};

const seedIfEmpty = async (Model, label, docsFn) => {
  const count = await Model.countDocuments();
  if (count > 0) {
    console.log(`  · ${label}: ${count} already present — skipped`);
    return Model.find().lean();
  }
  const docs = await Model.insertMany(await docsFn());
  console.log(`  ✓ ${label}: ${docs.length} added`);
  return docs.map((d) => d.toObject());
};

// ---------------------------------------------------------------- main

const run = async () => {
  await mongoose.connect(config.mongoUrl, { serverSelectionTimeoutMS: 15000 });
  console.log(`Seeding "${mongoose.connection.name}"…\n`);

  console.log("Catalogue");
  const services = await seedIfEmpty(Service, "Services", () => SERVICES);
  const packages = await seedIfEmpty(Package, "Combos", () => PACKAGES);
  const staff = await seedIfEmpty(Staff, "Staff", () => STAFF);
  await seedIfEmpty(Article, "Articles", () =>
    ARTICLES.map((a, i) => ({ ...a, publishDate: addDays(now, -(i * 9 + 2)) }))
  );
  await seedIfEmpty(Coupon, "Coupons", () => COUPONS);
  const settings = await Settings.current();
  settings.payment.cod = true;
  settings.payment.online = true;
  await settings.save();
  console.log("  ✓ Payment methods: pay at salon + online (demo) enabled");

  if (CATALOGUE_ONLY) return finish();

  console.log("\nDemo activity");
  if ((await User.countDocuments()) > 0 || (await Booking.countDocuments()) > 0) {
    console.log("  · Customers/bookings already exist — demo activity skipped");
    return finish();
  }

  const hash = await bcrypt.hash(DEMO_PASSWORD, 10);
  const users = await User.insertMany(CUSTOMERS.map((c) => ({ ...c, password: hash })));
  console.log(`  ✓ Customers: ${users.length} added (password: ${DEMO_PASSWORD})`);

  const today = dateKeyToDate(todayKey());
  const slotUse = new Map(); // "date|slot" -> count, keep within staff capacity
  const takeSlot = (date, preferred) => {
    for (let k = 0; k < TIME_SLOTS.length; k++) {
      const slot = TIME_SLOTS[(preferred + k) % TIME_SLOTS.length];
      const key = `${date.toISOString()}|${slot}`;
      if ((slotUse.get(key) || 0) < staff.length - 1) {
        slotUse.set(key, (slotUse.get(key) || 0) + 1);
        return slot;
      }
    }
    return TIME_SLOTS[preferred % TIME_SLOTS.length];
  };

  // Past bookings over the last ~6 months (completed, mostly paid), a few cancelled,
  // today's schedule, and upcoming bookings over the next two weeks.
  const bookings = [];
  let reviewIdx = 0;
  const plan = [
    ...Array.from({ length: 34 }, (_, i) => ({ offset: -Math.round(4 + i * 5.2), kind: i % 11 === 5 ? "cancelled" : "completed" })),
    ...Array.from({ length: 4 }, () => ({ offset: 0, kind: "today" })),
    ...Array.from({ length: 9 }, (_, i) => ({ offset: 1 + Math.round(i * 1.5), kind: i % 3 === 0 ? "pending" : "confirmed" })),
  ];

  plan.forEach((p, i) => {
    const user = pick(users, i * 5 + 1);
    const service = pick(services, i * 7 + 3);
    const stylist = pick(staff, i * 3);
    const date = addDays(today, p.offset);
    const timeSlot = takeSlot(date, (i * 3) % TIME_SLOTS.length);
    const online = i % 3 === 0;
    const useCoupon = i % 6 === 2 && service.price >= 2000;
    const discount = useCoupon ? 300 : 0;
    const createdAt = addDays(date, p.offset < 0 ? -3 : -Math.min(3, Math.max(0, 1 + (i % 3))) - (p.offset > 0 ? 0 : 0));
    const createdSafe = createdAt > now ? addDays(now, -1) : createdAt;

    const status =
      p.kind === "today" ? (i % 2 ? "confirmed" : "pending") : p.kind === "completed" ? "completed" : p.kind;
    const paid = status === "completed" || (online && status !== "cancelled");

    const doc = {
      user: user._id,
      service: service._id,
      date,
      timeSlot,
      status,
      cancelledBy: status === "cancelled" ? "user" : null,
      paymentMethod: online ? "online" : "cod",
      paymentStatus: status === "cancelled" ? (online ? "refunded" : "pending") : paid ? "paid" : "pending",
      price: service.price,
      couponCode: useCoupon ? "FESTIVE300" : undefined,
      discount,
      finalPrice: service.price - discount,
      assignedStaff: status === "pending" || status === "cancelled" ? null : stylist._id,
      createdAt: createdSafe,
    };
    if (online && paid) {
      doc.paymentRef = `DEMO-SEED${String(i).padStart(4, "0")}`;
      doc.transactionId = `TXN-SEED${String(i).padStart(4, "0")}`;
      doc.paymentInstrument = i % 2 ? "Visa •••• 4242" : `UPI ${user.email.split("@")[0]}@okaxis`;
    }
    if (status === "completed" && i % 3 !== 1 && reviewIdx < REVIEW_TEXT.length) {
      const [rating, comment] = REVIEW_TEXT[reviewIdx++];
      doc.reviews = [{ user: user._id, rating, comment, createdAt: addDays(date, 1), updatedAt: addDays(date, 1) }];
    }
    bookings.push(doc);
  });
  await insertWithDates(Booking, bookings);
  console.log(`  ✓ Bookings: ${bookings.length} added (past, today and upcoming)`);

  // Combo orders: one fully used & reviewed, two in progress, one expired.
  const orderPlan = [
    { user: 0, pkg: 1, daysAgo: 70, used: 4, review: [5, "The Gold Ritual is worth every rupee — colour, spa and a blow-dry I still think about."] },
    { user: 1, pkg: 0, daysAgo: 12, used: 1 },
    { user: 2, pkg: 2, daysAgo: 20, used: 2, review: [5, "Platinum Bridal made my wedding prep stress-free. The keratin and curls were perfect."] },
    { user: 4, pkg: 0, daysAgo: 45, used: 1 },
    { user: 5, pkg: 1, daysAgo: 3, used: 0 },
  ];
  const orders = orderPlan.map((o, i) => {
    const pkg = packages[o.pkg];
    const user = users[o.user];
    const createdAt = addDays(now, -o.daysAgo);
    const expiryDate = addDays(createdAt, pkg.validityDays || 30);
    const online = i % 2 === 0;
    const stylist = pick(staff, i + 1);
    return {
      user: user._id,
      package: pkg._id,
      orderDate: createdAt,
      expiryDate,
      status: expiryDate < now ? "expired" : "active",
      expiryReminderSent: expiryDate < now,
      price: pkg.price,
      discount: 0,
      finalPrice: pkg.price,
      paymentMethod: online ? "online" : "cod",
      paymentStatus: online || o.used > 0 ? "paid" : "pending",
      ...(online && { paymentRef: `DEMO-SEEDC${i}`, transactionId: `TXN-SEEDC${i}`, paymentInstrument: "Mastercard •••• 5454" }),
      servicesUsed: pkg.services.map((serviceName, j) => ({
        serviceName,
        used: j < o.used,
        usedAt: j < o.used ? addDays(createdAt, 3 + j * 7) : null,
        assignedStaff: j <= o.used ? stylist._id : null,
      })),
      reviews: o.review ? [{ user: user._id, rating: o.review[0], comment: o.review[1], createdAt: addDays(createdAt, 30), updatedAt: addDays(createdAt, 30) }] : [],
      createdAt,
    };
  });
  await insertWithDates(Order, orders);
  console.log(`  ✓ Combo orders: ${orders.length} added`);

  if ((await Message.countDocuments()) === 0) {
    await insertWithDates(
      Message,
      MESSAGES.map((m, i) => ({ read: false, ...m, createdAt: addDays(now, -(i * 2 + 1)) }))
    );
    console.log(`  ✓ Messages: ${MESSAGES.length} added`);
  }

  return finish();
};

const finish = async () => {
  await mongoose.disconnect();
  console.log("\nDone.");
};

run().catch(async (err) => {
  console.error("\nSeed failed:", err.message);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
