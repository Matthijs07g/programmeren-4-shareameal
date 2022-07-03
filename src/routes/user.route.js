const express = require("express");
const { getUser } = require("../contollers/user.controller");
const router = express.Router();
const userController = require("../contollers/user.controller");
const authController  = require("../contollers/auth.controller")

router.post("/api/user", authController.validateToken, userController.validateUser, userController.addUser);

router.get("/api/user/:Id", authController.validateToken, userController.getUser);

router.get("/api/user", authController.validateToken, userController.getAllUsers);

router.get("/api/profile", authController.validateToken, userController.getUserProfile)

router.put("/api/user/:Id", authController.validateToken, userController.validateUser, userController.putUser);

router.delete("/api/user/:Id", authController.validateToken, userController.deleteUser);

module.exports = router;
