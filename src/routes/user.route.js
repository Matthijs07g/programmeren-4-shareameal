const express = require("express");
const { getUser } = require("../contollers/user.controller");
const router = express.Router();
const userController = require("../contollers/user.controller");

router.post("/api/user", userController.validateUser, userController.addUser);

router.get("/api/user/:Id", userController.getUser);

router.get("/api/user", userController.getAllUsers);

router.put("/api/user/:Id", userController.putUser);

router.delete("/api/user/:Id", userController.deleteUser);

module.exports = router;
