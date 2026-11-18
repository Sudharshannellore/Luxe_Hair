const Package = require("../models/Package");
const { httpError } = require("../utils/httpError");

exports.createPackage = async (req, res) => {
  const pkg = await Package.create({
    ...req.body,
    services: req.body.services || [],
    features: req.body.features || [],
    image: req.file ? req.file.filename : "no-image.png",
  });
  res.status(201).json({ message: "Combo created", package: pkg });
};

exports.getPackages = async (req, res) => {
  res.json(await Package.find().sort({ price: 1 }).lean());
};

exports.getPackageById = async (req, res) => {
  const pkg = await Package.findById(req.params.id).lean();
  if (!pkg) throw httpError(404, "Combo not found");
  res.json(pkg);
};

exports.updatePackage = async (req, res) => {
  const update = { ...req.body };
  if (req.file) update.image = req.file.filename;
  const pkg = await Package.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true });
  if (!pkg) throw httpError(404, "Combo not found");
  res.json({ message: "Combo updated", package: pkg });
};

exports.deletePackage = async (req, res) => {
  const pkg = await Package.findByIdAndDelete(req.params.id);
  if (!pkg) throw httpError(404, "Combo not found");
  res.json({ message: "Combo deleted" });
};
