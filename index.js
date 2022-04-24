const express = require("express");
const app = express();
const port = process.env.PORT || 3000;

const bodyParser = require("body-parser");
app.use(bodyParser.json());

let database = [];
let id = 0;

app.all("*", (req, res, next) => {
  const method = req.method;
  console.log(`Method ${method} is aangeroepen`);
  next();
});

app.post("/api/user", (req, res) => {
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
});

app.get("/api/user/:Id", (req, res, next) => {
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

app.get("/api/user", (req, res, next) => {
  res.status(200).json({
    status: 200,
    result: database,
  });
});

app.put("/api/user/:Id", (req, res, next) => {
  const Id = req.params.Id;
  let user = database.filter((item) => item.id == Id);
  let info = req.body;
  info = {
    Id,
    ...user,
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

app.delete("/api/user/:Id", (req, res, next) => {
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

app.all("*", (req, res) => {
  res.status(401).json({
    status: 401,
    result: "End-point not found",
  });
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
