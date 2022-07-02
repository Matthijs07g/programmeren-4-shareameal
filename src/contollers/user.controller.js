const dbconnection = require("../../database/dbconnection");
const assert = require("assert");

let id = 0;

let controller = {
  validateUser: (req, res, next) => {
    let user = req.body;
    let { firstName, lastName, street, city, password, emailAdress } = user;

    try {
      assert(typeof firstName === "string", "Firstname must be a string");
      assert(typeof lastName === "string", "Lastname must be a string");
      assert(typeof street === "string", "Street must be a string");
      assert(typeof city === "string", "City must be a string");
      assert(typeof password === "string", "Password must be a string");
      assert(typeof emailAdress === "string", "Emailadress must be a string");
      next();
    } catch (err) {
      const error = {
        status: 400,
        result: err.message,
      };
      next(error);
    }
  },
  addUser: (req, res) => {
    let user = req.body;
    id++;
    user = {
      id,
      ...user,
    };

    dbconnection.getConnection(function (err, connection) {
      if (err) throw err; // not connected!

      const firstName = user.firstName;
      const lastName = user.lastName;
      const street = user.street;
      const city = user.city;
      const password = user.password;
      const emailAdress = user.emailAdress;

      connection.query(
        "INSERT INTO user (firstName, lastName, street, city, password, emailAdress) VALUES(?, ?, ?, ?, ?, ?); SELECT * FROM user WHERE emailAdress = ?",
        [firstName, lastName, street, city, password, emailAdress, emailAdress],
        function (error, results, fields) {
          if (error) {
            console.log(error);
            res.status(409).json({
              status: 409,
              message: "User already exists",
            });
          } else {
            console.log(results[1]);
            res.status(201).json({
              status: 201,
              result: results[1],
            });
          }
        }
      );
    });
  },
  getAllUsers: (req, res) => {
    dbconnection.getConnection(function (err, connection) {
      if (err) throw err; // not connected!

      // Use the connection
      connection.query("SELECT * FROM user", function (error, results, fields) {
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
  getUser: (req, res, next) => {
    const Id = req.params.Id;
    console.log(`User met ID ${Id} gezocht`);
    dbconnection.getConnection(function (err, connection) {
      if (err) throw err; // not connected!

      // Use the connection
      connection.query(
        "SELECT * FROM user WHERE id = ?",
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
              message: "user not found",
            });
          }
        }
      );
    });
  },
  putUser: (req, res, next) => {
    const Id = req.params.Id;
    dbconnection.getConnection(function (err, connection) {
      if (err) throw err; // not connected!

      const firstName = user.firstName;
      const lastName = user.lastName;
      const street = user.street;
      const city = user.city;
      const password = user.password;
      const emailAdress = user.emailAdress;

      connection.query(
        "UPDATE user SET firstName=?, lastName=?, street=?, city=?, password=?, emailAdress=? WHERE id = ?;",
        [firstName, lastName, street, city, password, emailAdress, Id],
        function (error, results, fields) {
          if (error) {
            console.log(error);
            res.status(409).json({
              status: 409,
              message: "User already exists",
            });
          } else if (results.affectedRows < 1) {
            res.status(400).json({
              status: 400,
              message: "User not found",
            });
          } else {
            console.log(results[1]);
            res.status(200).json({
              status: 200,
              result: results[1],
            });
          }
        }
      );
    });
  },
  deleteUser: (req, res, next) => {
    const Id = req.params.Id;
    dbconnection.getConnection(function (err, connection) {
      if (err) throw err; // not connected!

      // Use the connection
      connection.query(
        "DELETE FROM user WHERE id=?",
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
              message: "User has been deleted",
            });
          } else {
            res.status(400).json({
              status: 400,
              message: "User not found",
            });
          }
        }
      );
    });
  },
};
module.exports = controller;
