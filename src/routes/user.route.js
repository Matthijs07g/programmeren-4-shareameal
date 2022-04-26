const express = require("express");
const router = express.Router();
const userController = require("../contollers/user.controller");

let database = [];
let id = 0;

router.post("/api/user", userController.addUser);

router.get("/api/user/:Id", (req, res, next) => {
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
    res.status(401).json({
      status: 401,
      result: `User with ID ${Id} not found`,
    });
  }
});

router.get("/api/user", userController.getAllUsers);

router.put("/api/user/:Id", (req, res, next) => {
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
    res.status(401).json({
      status: 401,
      result: "User not found",
    });
  }
});

router.delete("/api/user/:Id", (req, res, next) => {
  const Id = req.params.Id;
  let user = database.filter((item) => item.id == Id);
  if (user.length > 0) {
    database.shift(user);
    res.status(201).json({
      status: 201,
      result: database,
    });
  } else {
    res.status(401).json({
      status: 401,
      result: "user with id " + Id + " not found",
    });
  }
});

module.exports = router;
