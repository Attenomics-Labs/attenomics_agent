// src/controllers/exampleController.js
exports.getExample = (req, res, next) => {
    try {
      // Business logic here...
      res.json({ message: "GET example" });
    } catch (error) {
      next(error);
    }
  };
  
  exports.createExample = (req, res, next) => {
    try {
      // Business logic here...
      res.status(201).json({ message: "POST example" });
    } catch (error) {
      next(error);
    }
  };
  