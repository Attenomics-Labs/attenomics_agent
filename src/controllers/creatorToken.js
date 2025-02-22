
exports.getCreators = (req, res, next) => {
    try {
      // Business logic here...
      console.log("GET example");
      res.json({ message: "GET example" });
    } catch (error) {
      next(error);
    }
  };
  
  exports.storeCreatorToken = (req, res, next) => {
    try {
      // Business logic here...
      console.log("POST example");
      res.status(201).json({ message: "POST example" });
    } catch (error) {
      next(error);
    }
  };
  