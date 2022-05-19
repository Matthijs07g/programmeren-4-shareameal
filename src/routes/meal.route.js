const express = require("express");
const router = express.Router();
const mealController = require("../contollers/meal.controller");

router.post("/api/meal", mealController.validateMeal, mealController.addMeal);

router.get("/api/meal/:Id", mealController.getMeal);

router.get("/api/meal", mealController.getAllMeals);

router.put("/api/meal/:Id", mealController.putMeal);

router.delete("/api/meal/:Id", mealController.deleteMeal);

module.exports = router;
