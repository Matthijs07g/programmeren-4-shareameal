let id = 0;
let database = [];

let controller = {
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
};
module.exports = controller;
