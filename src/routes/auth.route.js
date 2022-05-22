const routes = require("express").Router();
const AuthController = require("../contollers/auth.controller");

routes.post("/auth/login", AuthController.validateLogin, AuthController.login);

module.exports = routes;
