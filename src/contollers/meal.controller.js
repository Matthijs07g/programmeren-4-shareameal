const dbconnection = require("../../database/dbconnection");
const assert = require("assert");

let id = 0;
let database = [];

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
      assert(typeof isVega === "boolean", "isVega must be a string");
      assert(typeof isVegan === "boolean", "isVegan must be a string");
      assert(
        typeof isToTakeHome === "boolean",
        "isToTakeHome must be a string"
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
    console.log(meal);
    database.push(meal);
    res.status(201).json({
      status: 201,
      result: database,
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
    console.log(`Meal met ID ${Id} gezocht`);
    let meal = database.filter((item) => item.id == Id);
    if (meal.length > 0) {
      console.log(meal);
      res.status(200).json({
        status: 200,
        result: meal,
      });
    } else {
      const error = {
        status: 401,
        result: `Meal with ID ${Id} not found`,
      };
      next(error);
    }
  },
  deleteMeal: (req, res, next) => {
    const Id = req.params.Id;
    let meal = database.filter((item) => item.id == Id);
    if (meal.length > 0) {
      database.shift(meal);
      res.status(201).json({
        status: 201,
        result: database,
      });
    } else {
      const error = {
        status: 401,
        result: `User with ID ${Id} not found`,
      };
      next(error);
    }
  },
};
module.exports = controller;
