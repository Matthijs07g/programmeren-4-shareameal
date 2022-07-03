const dbconnection = require("../../database/dbconnection");
const assert = require("assert");

let id = 0;

let controller = {
  validateUser: (req, res, next) => {
    let user = req.body;
    let { firstName, lastName, street, city, password, emailAdress, phoneNumber } = user;

    try {
      assert(typeof firstName === "string", "Firstname must be a string");
      assert(typeof lastName === "string", "Lastname must be a string");
      assert(typeof street === "string", "Street must be a string");
      assert(typeof city === "string", "City must be a string");
      assert(typeof password === "string", "Password must be a string");
      assert(typeof emailAdress === "string", "Emailadress must be a string");
      assert(typeof phoneNumber ==="string", "Phonenumber must be a string")
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
      const phoneNumber = user.phoneNumber;

      connection.query(
        "INSERT INTO user (firstName, lastName, street, city, password, emailAdress, phoneNumber) VALUES(?, ?, ?, ?, ?, ?, ?); SELECT * FROM user WHERE emailAdress = ?",
        [firstName, lastName, street, city, password, emailAdress, phoneNumber, emailAdress],
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
    let query = "SELECT * FROM user";
    let {count, isActive, firstName} = req.query;
    if (isActive && firstName) {query += ` WHERE firstName = '${firstName}' AND isActive = ${isActive}`;
    } else if (isActive) {query += ` WHERE isActive = ${isActive}`;
    } else if (firstName) {query += ` WHERE firstName = '${firstName}'`;
    } if (count) {query += ` LIMIT ${count}`;
    }

    dbconnection.getConnection(function (err, connection) {
      if (err) throw err; // not connected!

      // Use the connection
      connection.query(query, function (error, results, fields) {
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
  getUserProfile:(req, res, next) =>{
    const Id = req.userId;
    dbconnection.getConnection(function (err, connection) {
      if (err) throw err; // not connected!
      connection.query(
        "SELECT * FROM user WHERE id = ?;",
        [Id],
        function (error, results, fields) {
          connection.release();
          if (error) {
            console.log(error);
            next(error)
            } else if (results.affectedRows > 0) {
              console.log(results[1]);
              res.status(200).json({
                status: 200,
                result: results[1],
            });
          } else {
            res.status(401).json({
              status: 401,
              result: "unknown error",
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
      let user = req.body;
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
            let user = {id: req.params.userId, ...req.body}
            res.status(200).json({
              status: 200,
              message: user,
            });
          }
        }
      );
    });
  },
  deleteUser: (req, res, next) => {
    const Id = req.params.Id;
    dbconnection.getConnection(function (err, connection) {
      //not connected
      if (err) {
        next(err);
      }
      connection.query(
    "SELECT * FROM user WHERE id = ?",
    [Id],
    function (error, results, fields) {
      // When done with the connection, release it.
      // connection.release();
      // Handle error after the release.
      if (error) throw error;
      // succesfull query handlers
      if(results.length<1){
        res.status(400).json({
          status: 400,
          message: "User not found",
        });
      }else{
      if (results.length > 0 && results[0].Id != req.userId) {
        return res.status(403).json({
          status: 403,
          message: `user not found or not authorized`,
        });
      } else {
    
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
            res.status(404).json({
              status: 404,
              message: "Unkown error",
            });
          }
        }
      );
    }
  }
  }
  );
  });
}
}
module.exports = controller;
