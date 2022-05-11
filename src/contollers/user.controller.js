const assert = require("assert");

let id = 0;
let database = [];

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
    console.log(user);
    database.push(user);
    res.status(201).json({
      status: 201,
      result: database,
    });
  },
  getAllUsers: (req, res) => {
    res.status(200).json({
      status: 200,
      result: database,
    });
  },
  getUser: (req, res, next) => {
    const Id = req.params.Id;
    console.log(`User met ID ${Id} gezocht`);
    let user = database.filter((item) => item.id == Id);
    if (user.length > 0) {
      console.log(user);
      res.status(200).json({
        status: 200,
        result: user,
      });
    } else {
      const error = {
        status: 401,
        result: `User with ID ${Id} not found`,
      };
      next(error);
    }
  },
  putUser: (req, res, next) => {
    const Id = req.params.Id;
    let user = database.filter((item) => item.id == Id);
    let info = req.body;
    info = {
      Id,
      ...info,
    };
    if (user.length > 0) {
      database.shift(user);
      database.push(info);
      res.status(200).json({
        status: 200,
        result: info,
      });
    } else {
      const error = {
        status: 401,
        result: `User with ID ${Id} not found`,
      };
      next(error);
    }
  },
  deleteUser: (req, res, next) => {
    const Id = req.params.Id;
    let user = database.filter((item) => item.id == Id);
    if (user.length > 0) {
      database.shift(user);
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
