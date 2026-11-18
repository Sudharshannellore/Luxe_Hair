const Service = require("../models/Service");
const { httpError } = require("../utils/httpError");

exports.createService = async (req, res) => {
  const service = await Service.create({
    ...req.body,
    benefits: req.body.benefits || [],
    image: req.file ? req.file.filename : "no-image.png",
  });
  res.status(201).json({ message: "Service created", service });
};

exports.getServices = async (req, res) => {
  res.json(await Service.find().sort({ createdAt: -1 }).lean());
};

exports.getServiceById = async (req, res) => {
  const service = await Service.findById(req.params.id).lean();
  if (!service) throw httpError(404, "Service not found");
  res.json(service);
};

exports.updateService = async (req, res) => {
  const update = { ...req.body };
  if (req.file) update.image = req.file.filename;
  const service = await Service.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true });
  if (!service) throw httpError(404, "Service not found");
  res.json({ message: "Service updated", service });
};

exports.deleteService = async (req, res) => {
  const service = await Service.findByIdAndDelete(req.params.id);
  if (!service) throw httpError(404, "Service not found");
  res.json({ message: "Service deleted" });
};
