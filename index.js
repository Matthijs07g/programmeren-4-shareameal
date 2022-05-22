const express = require("express");
const app = express();
require("dotenv").config();
const port = process.env.PORT;
const userRouter = require("./src/routes/user.route");
const bodyParser = require("body-parser");
const { route } =
  require("./src/routes/user.route") || require("./src/routes/meal.route");
const mealRouter = require("./src/routes/meal.route");
const authRouter = require("./src/routes/auth.route");

app.use(bodyParser.json());

app.all("*", (req, res, next) => {
  const method = req.method;
  console.log(`Method ${method} is aangeroepen`);
  next();
});

app.use(userRouter);
app.use(mealRouter);
app.use(authRouter);

app.all("*", (req, res) => {
  res.status(401).json({
    status: 401,
    result: "End-point not found",
  });
});

app.use((err, req, res, next) => {
  res.status(err.status).json(err);
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});

module.exports = app;
