// process.env.DB_DATABASE = process.env.DB_DATABASE || "testdb";
// process.env.LOGLEVEL = "warn";

// const chai = require("chai");
// const chaiHttp = require("chai-http");
// const server = require("../../index");
// const assert = require("assert");
// require("dotenv").config();
// const dbconnection = require("../../database/dbconnection");
// const jwt = require("jsonwebtoken");
// const { jwtSecretKey, logger } = require("../../src/config/config");

// chai.should();
// chai.use(chaiHttp);

// /**
//  * Db queries to clear and fill the test database before each test.
//  */
// const CLEAR_MEAL_TABLE = "DELETE IGNORE FROM `meal`;";
// const CLEAR_PARTICIPANTS_TABLE = "DELETE IGNORE FROM `meal_participants_user`;";
// const CLEAR_USERS_TABLE = "DELETE IGNORE FROM `user`;";
// const CLEAR_DB =
//   CLEAR_MEAL_TABLE + CLEAR_PARTICIPANTS_TABLE + CLEAR_USERS_TABLE;

// /**
//  * Voeg een user toe aan de database. Deze user heeft id 1.
//  * Deze id kun je als foreign key gebruiken in de andere queries, bv insert meal.
//  */
// const INSERT_USER =
//   "INSERT INTO `user` (`id`, `firstName`, `lastName`, `emailAdress`, `password`, `street`, `city` ) VALUES" +
//   '(1, "first", "last", "name@server.nl", "secret", "street", "city");';

// /**
//  * Query om twee meals toe te voegen. Let op de cookId, die moet matchen
//  * met een bestaande user in de database.
//  */
// const INSERT_MEALS =
//   "INSERT INTO `meal` (`id`, `name`, `description`, `imageUrl`, `dateTime`, `maxAmountOfParticipants`, `price`, `cookId`) VALUES" +
//   "(1, 'Meal A', 'description', 'image url', NOW(), 5, 6.50, 1)," +
//   "(2, 'Meal B', 'description', 'image url', NOW(), 5, 6.50, 1);";

// describe("Manage meals", () => {
//   describe("UC-301 Maaltijd aanmaken /api/meal", () => {
//     beforeEach((done) => {
//       dbconnection.getConnection(function (err, connection) {
//         if (err) throw err; // not connected!

//         // Use the connection
//         connection.query(
//           CLEAR_DB + INSERT_USER,
//           function (error, results, fields) {
//             // When done with the connection, release it.
//             connection.release();

//             // Handle error after the release.
//             if (error) throw error;
//             // Let op dat je done() pas aanroept als de query callback eindigt!
//             logger.debug("beforeEach done");
//             done();
//           }
//         );
//       });
//     });
//     it("TC-301-1 Verplicht veld ontbreekt", (done) => {
//       chai
//         .request(server)
//         .post("/api/meal")
//         .send({
//           firstName: "Mark",
//           lastName: "Doe",
//           street: "Lovensdijkstraat 61",
//           city: "Breda",
//           password: "secret",
//           //emailAdress ontbreekt
//         })
//         .end((err, res) => {
//           res.should.be.an("object");
//           let { status, result } = res.body;
//           status.should.equals(400);
//           result.should.be
//             .a("string")
//             .that.equals("Emailadress must be a string");
//             done();
//             });
//         });
//     });
// })