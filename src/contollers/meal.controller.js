const dbconnection = require("../../database/dbconnection");
const assert = require("assert");

let id = 0;

let controller = {
  validateMeal: (req, res, next) => {
    let meal = req.body;
    let {
      name,
      description,
      isActive,
      isVega,
      isVegan,
      isToTakeHome,
      dateTime,
      imageUrl,
      allergenes,
      maxAmountOfParticipants,
      price,
    } = meal;

    try {
      assert(typeof name === "string", "name must be a string");
      assert(typeof description === "string", "description must be a string");
      assert(typeof isActive === "boolean", "isActive must be a boolean");
      assert(typeof isVega === "boolean", "isVega must be a boolean");
      assert(typeof isVegan === "boolean", "isVegan must be a boolean");
      assert(
        typeof isToTakeHome === "boolean",
        "isToTakeHome must be a boolean"
      );
      assert(typeof dateTime === "string", "dateTime must be a string");
      assert(typeof imageUrl === "string", "imageUrl must be a string");
      assert(typeof allergenes === "string", "allergenes must be a string");
      assert(
        typeof maxAmountOfParticipants === "number",
        "maxAmountOfParticipants must be a number"
      );
      assert(typeof price === "number", "price must be a number");
      next();
    } catch (err) {
      const error = {
        status: 400,
        result: err.message,
      };
      next(error);
    }
  },
  addMeal: (req, res) => {
    let meal = req.body;
    id++;
    meal = {
      id,
      ...meal,
    };

    dbconnection.getConnection(function (err, connection) {
      if (err) throw err; // not connected!

      const cook = req.userID;
      const name = meal.name;
      const description = meal.description;
      const isActive = meal.isActive;
      const isVega = meal.isVega;
      const isVegan = meal.isVegan;
      const isToTakeHome = meal.isToTakeHome;
      const dateTime = meal.dateTime;
      const imageUrl = meal.imageUrl;
      const allergenes = meal.allergenes;
      const maxAmountOfParticipants = meal.maxAmountOfParticipants;
      const price = meal.price;

      connection.query(
        "INSERT INTO meal (cookId, name, description, isActive, isVega, isVegan, isToTakeHome, dateTime, imageUrl, allergenes, maxAmountOfParticipants, price) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [
          cook,
          name,
          description,
          isActive,
          isVega,
          isVegan,
          isToTakeHome,
          dateTime,
          imageUrl,
          allergenes,
          maxAmountOfParticipants,
          price,
        ],
        function (error, results, fields) {
          connection.release();
          if (error)  throw error
          if(results.affectedRows>0){
            let addedMeal = {id: results.insertId, ...req.body}
            console.log(addedMeal);
            res.status(201).json({
              status: 201,
              result: addedMeal,
            });
          }  
        }
      );
    });
  },
  getAllMeals: (req, res) => {
    dbconnection.getConnection(function (err, connection) {
      if (err) throw err; // not connected!

      // Use the connection
      connection.query("SELECT * FROM meal", function (error, results, fields) {
        // When done with the connection, release it.
        connection.release();

        // Handle error after the release.
        if (error) throw error;

        // Don't use the connection here, it has been returned to the pool.
        console.log("results=", results.length);

        res.status(200).json({
          status: 200,
          result: results,
        });

        // dbconnection.end((err) => {
        //   console.log("pool was closed.");
        // });
      });
    });
  },
  getMeal: (req, res, next) => {
    const Id = req.params.Id;
    console.log(`meal met ID ${Id} gezocht`);
    dbconnection.getConnection(function (err, connection) {
      if (err) throw err; // not connected!

      // Use the connection
      connection.query(
        "SELECT * FROM meal WHERE id = ?",
        [Id],
        function (error, results, fields) {
          if (results.length > 0) {
            res.status(200).json({
              status: 200,
              message: results[0],
            });
          } else {
            res.status(404).json({
              status: 404,
              message: "Meal not found",
            });
          }
        }
      );
    });
  },
  deleteMeal: (req, res, next) => {
    const Id = req.params.Id;
    dbconnection.getConnection(function (err, connection) {
      //not connected
      if (err) {
        next(err);
      }
      connection.query(
    "SELECT * FROM meal WHERE id = ?",
    [Id],
    function (error, results, fields) {
      // When done with the connection, release it.
      // connection.release();
      // Handle error after the release.
      if (error) throw error;
      // succesfull query handlers
      if (results.length > 0 && results[0].cookId != req.userId) {
        return res.status(403).json({
          status: 403,
          message: `Meal not found or not authorized`,
        });
      } else {
    
      // Use the connection
      connection.query(
        "DELETE FROM meal WHERE id=?",
        [Id],
        function (error, results, fields) {
          // When done with the connection, release it.
          connection.release();

          // Handle error after the release.
          if (error) throw error;

          // Don't use the connection here, it has been returned to the pool.
          if (results.affectedRows > 0) {
            res.status(200).json({
              status: 200,
              message: "Meal has been deleted",
            });
          } else {
            res.status(404).json({
              status: 404,
              message: "Meal not found",
            });
          }
        }
      );
    }
  }
  );
  });
}
}

  
module.exports = controller;
