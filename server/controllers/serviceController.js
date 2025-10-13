const Service = require("../models/Service");

// Create new service
exports.createService = async (req, res) => {
  try {
    const { title, category, price, duration, description, benefits } = req.body;

    const newService = new Service({
      title,
      category,
      price,
      duration,
      description,
      benefits: benefits ? JSON.parse(benefits) : [], // benefits will come as string array from form-data
      image: req.file ? req.file.filename : "no-image.png"
    });

    await newService.save();
    res.status(201).json({ message: "Service created successfully", service: newService });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get all services
exports.getServices = async (req, res) => {
  try {
    const services = await Service.find(); // removed populate
    res.status(200).json(services);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// Get single service by ID
exports.getServiceById = async (req, res) => {
  try {
    const service = await Service.findById(req.params.id); // removed populate
    if (!service) return res.status(404).json({ message: "Service not found" });
    res.status(200).json(service);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// Update service
exports.updateService = async (req, res) => {
  try {
    const updateData = { ...req.body };
    if (req.file) updateData.image = req.file.filename;

    if (updateData.benefits) {
      updateData.benefits = JSON.parse(updateData.benefits);
    }

    const updatedService = await Service.findByIdAndUpdate(req.params.id, updateData, { new: true });
    if (!updatedService) return res.status(404).json({ message: "Service not found" });

    res.status(200).json({ message: "Service updated", service: updatedService });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// Delete service
exports.deleteService = async (req, res) => {
  try {
    const deletedService = await Service.findByIdAndDelete(req.params.id);
    if (!deletedService) return res.status(404).json({ message: "Service not found" });
    res.status(200).json({ message: "Service deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};
