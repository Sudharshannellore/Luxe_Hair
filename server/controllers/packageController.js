const Package = require("../models/Package");

// Create new package
exports.createPackage = async (req, res) => {
  try {
    const { title, subtitle, price, services, features } = req.body;

    const newPackage = new Package({
      title,
      subtitle,
      price,
      services: services ? JSON.parse(services) : [],
      image: req.file ? req.file.filename : "no-image.png",
      features: features ? JSON.parse(features) : [],
    });

    await newPackage.save();
    res.status(201).json({ message: "Package created successfully", package: newPackage });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get all packages
exports.getPackages = async (req, res) => {
  try {
    const packages = await Package.find(); // no reviews field to populate
    res.status(200).json(packages);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get single package by ID
exports.getPackageById = async (req, res) => {
  try {
    const packageData = await Package.findById(req.params.id);
    if (!packageData) return res.status(404).json({ message: "Package not found" });
    res.status(200).json(packageData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// Update package
exports.updatePackage = async (req, res) => {
  try {
    const updateData = { ...req.body };
    if (req.file) updateData.image = req.file.filename;

    if (updateData.services) {
      updateData.services = JSON.parse(updateData.services);
    }

    if (updateData.features) {
      updateData.features = JSON.parse(updateData.features);
    }

    const updatedPackage = await Package.findByIdAndUpdate(req.params.id, updateData, { new: true });
    if (!updatedPackage) return res.status(404).json({ message: "Package not found" });

    res.status(200).json({ message: "Package updated successfully", package: updatedPackage });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// Delete package
exports.deletePackage = async (req, res) => {
  try {
    const deletedPackage = await Package.findByIdAndDelete(req.params.id);
    if (!deletedPackage) return res.status(404).json({ message: "Package not found" });
    res.status(200).json({ message: "Package deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};
