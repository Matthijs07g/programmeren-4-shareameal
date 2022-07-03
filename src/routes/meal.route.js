const express = require("express");
const router = express.Router();
const mealController = require("../contollers/meal.controller");
const authController = require("../contollers/auth.controller");

router.post("/api/meal", authController.validateToken, mealController.validateMeal, mealController.addMeal);

router.get("/api/meal/:Id", authController.validateToken, mealController.getMeal);

router.get("/api/meal", authController.validateToken, mealController.getAllMeals);

router.delete("/api/meal/:Id", authController.validateToken, mealController.deleteMeal);

module.exports = router;
