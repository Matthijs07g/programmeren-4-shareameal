process.env.DB_DATABASE = process.env.DB_DATABASE || "testdb";
process.env.LOGLEVEL = "warn";

const chai = require("chai");
const chaiHttp = require("chai-http");
const server = require("../../index");
const assert = require("assert");
require("dotenv").config();
const dbconnection = require("../../database/dbconnection");
const jwt = require("jsonwebtoken");
const { jwtSecretKey, logger } = require("../../src/config/config");
const { expect } = require("chai");
const { error } = require("console");

chai.should();
chai.use(chaiHttp);

/**
 * Db queries to clear and fill the test database before each test.
 */
const CLEAR_MEAL_TABLE = "DELETE IGNORE FROM `meal`;";
const CLEAR_PARTICIPANTS_TABLE = "DELETE IGNORE FROM `meal_participants_user`;";
const CLEAR_USERS_TABLE = "DELETE IGNORE FROM `user`;";
const CLEAR_DB =
  CLEAR_MEAL_TABLE + CLEAR_PARTICIPANTS_TABLE + CLEAR_USERS_TABLE;

/**
 * Voeg een user toe aan de database. Deze user heeft id 1.
 * Deze id kun je als foreign key gebruiken in de andere queries, bv insert meal.
 */
 const INSERT_USER =
 "INSERT INTO `user` (`id`, `firstName`, `lastName`, `emailAdress`, `password`, `street`, `city`, `isActive`, phoneNumber) VALUES" +
 '(1, "first", "last", "name@server.nl", "secret", "street", "city", 1, "0612345678"),'+
 "(2, 'abcde', 'fghi', 'test@test.nl', 'secret', 'street', 'city', 0, '0612345678');";


/**
 * Query om twee meals toe te voegen. Let op de cookId, die moet matchen
 * met een bestaande user in de database.
 */
const INSERT_MEALS =
  "INSERT INTO `meal` (`id`, `name`, `description`, `imageUrl`, `dateTime`, `maxAmountOfParticipants`, `price`, `cookId`) VALUES" +
  "(1, 'Meal A', 'description', 'image url', NOW(), 5, 6.50, 1)," +
  "(2, 'Meal B', 'description', 'image url', NOW(), 5, 6.50, 1);";

describe("Manage meals", () => {
  describe("UC-301 Maaltijd aanmaken /api/meal", () => {
    beforeEach((done) => {
      dbconnection.getConnection(function (err, connection) {
        if (err) throw err; // not connected!

        // Use the connection
        connection.query(
          CLEAR_DB + INSERT_USER + INSERT_MEALS,
          function (error, results, fields) {
            // When done with the connection, release it.
            connection.release();

            // Handle error after the release.
            if (error) throw error;
            // Let op dat je done() pas aanroept als de query callback eindigt!
            logger.debug("beforeEach done");
            done();
          }
        );
      });
    });
    it("TC-301-1 verplicht veld ontbreekt", (done) => {
        chai
          .request(server)
          .post("/api/meal")
          .set("authorization", "Bearer " + jwt.sign({ userId: 1 }, jwtSecretKey))
          .send({
            //name ontbreekt
            description: "Dé pastaklassieker bij uitstek.",
            isActive: true,
            isVega: true,
            isVegan: true,
            isToTakeHome: true,
            datetime: "2022-05-21 07:11:46",
            imageUrl:
              "https://miljuschka.nl/wp-content/uploads/2021/02/Pasta-bolognese-3-2.jpg",
            allergenes: ["gluten", "lactose"],
            maxAmountOfParticipants: 6,
            price: 6.75,
            cookId: 1,
          })
          .end((err, res) => {
            res.should.be.an("object");
            let { status, result } = res.body;
            status.should.equals(400);
            result.should.be
              .a("string")
              .that.equals("name must be a string");
            done();
          });
      });
  
      it("TC-301-2 niet ingelogd", (done) => {
        chai
          .request(server)
          .post("/api/meal")
          .send({
            name: "AtestingMeal",
            description: "Dé pastaklassieker bij uitstek.",
            isActive: true,
            isVega: true,
            isVegan: true,
            isToTakeHome: true,
            dateTime: "2022-05-21T07:11:46.701Z",
            imageUrl:
              "https://miljuschka.nl/wp-content/uploads/2021/02/Pasta-bolognese-3-2.jpg",
            allergenes: ["gluten", "lactose"],
            maxAmountOfParticipants: 6,
            price: 6.75,
            cookId: 1,
          })
          .end((err, res) => {
            res.should.be.an("object");
            let { status, error } = res.body;
            status.should.equals(401);
            error.should.be
              .a("string")
              .that.equals("Authorization header missing!");
            done();
          });
      });
  
      it("TC-301-3 succesvol toegevoegd", (done) => {
        chai
          .request(server)
          .post("/api/meal")
          .set("authorization", "Bearer " + jwt.sign({ userId: 1 }, jwtSecretKey))
          .send({
            name: "AtestingMeal",
            description: "Dé pastaklassieker bij uitstek.",
            isActive: true,
            isVega: true,
            isVegan: true,
            isToTakeHome: true,
            dateTime: "2022-07-03 07:11:46",
            imageUrl:
              "https://miljuschka.nl/wp-content/uploads/2021/02/Pasta-bolognese-3-2.jpg",
            allergenes: "gluten",
            maxAmountOfParticipants: 6,
            price: 6.75,
          })
          .end((err, res) => {
            res.should.be.an("object");
            let { status, result } = res.body;
            status.should.equals(201);
            result.should.be.a("object").that.contains({  
              id: result.id,
              name: "AtestingMeal",
              description: "Dé pastaklassieker bij uitstek.",
              isActive: result.isActive,
              isVega: result.isVega,
              isVegan: result.isVegan,
              isToTakeHome: result.isToTakeHome,
              dateTime: "2022-07-03 07:11:46",
              imageUrl:
                "https://miljuschka.nl/wp-content/uploads/2021/02/Pasta-bolognese-3-2.jpg",
              allergenes: result.allergenes,
              maxAmountOfParticipants: 6,
              price: 6.75,
            });
            done();
          });
      });
    }); 
    describe("UC-303, lijst van maaltijden, api/meal ", () => {
      beforeEach((done) => {
        logger.debug("mealTests: beforeEach called.");
        dbconnection.getConnection(function (err, connection) {
          if (err) throw err; // not connected!
          connection.query(
            CLEAR_DB + INSERT_USER + INSERT_MEALS,
            function (error, results, fields) {
              // When done with the connection, release it.
              connection.release();
  
              // Handle error after the release.
              if (error) throw error;
              done();
            }
          );
        });
      });
      it("TC-303-1 get list of all meals.", (done) => {
        chai
          .request(server)
          .get("/api/meal")
          .set("authorization", "Bearer " + jwt.sign({ userId: 1 }, jwtSecretKey))
          .end((err, res) => {
            res.should.be.an("object");
            let { status, result } = res.body;
            status.should.equals(200);
            result.should.be.an("array");
            done();
          });
      });
    });
  
    describe("UC-304, details van maaltijd, api/meal/Id ", () => {
      beforeEach((done) => {
        logger.debug("mealTests: beforeEach called.");
        dbconnection.getConnection(function (err, connection) {
          if (err) throw err; // not connected!
          connection.query(
            CLEAR_DB + INSERT_USER + INSERT_MEALS,
            function (error, results, fields) {
              // When done with the connection, release it.
              connection.release();
  
              // Handle error after the release.
              if (error) throw error;
              done();
            }
          );
        });
      });
      it("TC-304-1, maaltijd bestaat niet", (done) => {
        chai
          .request(server)
          .get(`/api/meal/0`)
          .set("authorization", "Bearer " + jwt.sign({ userId: 1 }, jwtSecretKey))
          .end((err, res) => {
            res.should.be.an("object");
            let { status, message } = res.body;
            status.should.equals(404);
            message.should.be
              .a("string")
              .that.equals(`Meal not found`);
            done();
          });
      });
  
      it("TC-304-2, maaltijd bestaat", (done) => {
        chai
          .request(server)
          .get(`/api/meal/1`)
          .set("authorization", "Bearer " + jwt.sign({ userId: 1 }, jwtSecretKey))
          .end((err, res) => {
            res.should.be.an("object");
            let { status, message } = res.body;
            status.should.equals(200);
            message.should.be.a("object").that.contains({
              id: 1,
              name: "Meal A",
              description: "description",
              isActive: 0,
              isVega: 0,
              isVegan: 0,
              isToTakeHome: 1,
              dateTime: message.dateTime,
              imageUrl: "image url",
              allergenes: message.allergenes,
              maxAmountOfParticipants: 5,
              price: message.price,
              cookId: 1,
            });
            done();
          });
      });
    });
    describe("UC-305, deleting a meal, api/meal/Id ", () => {
      beforeEach((done) => {
        logger.debug("mealTests: beforeEach called.");
        dbconnection.getConnection(function (err, connection) {
          if (err) throw err; // not connected!
          connection.query(
            CLEAR_DB + INSERT_USER + INSERT_MEALS,
            function (error, results, fields) {
              // When done with the connection, release it.
              connection.release();
  
              // Handle error after the release.
              if (error) throw error;
              done();
            }
          );
        });
      });
      it("TC-305-2 niet ingelogd", (done) => {
        chai
          .request(server)
          .delete("/api/meal/1")
          .end((err, res) => {
            res.should.be.an("object");
            let { status, error } = res.body;
            status.should.equals(401);
            error.should.be
              .a("string")
              .that.equals("Authorization header missing!");
            done();
          });
      });
      it("TC-305-3 niet de eigenaar van de data", (done) => {
        chai
          .request(server)
          .delete("/api/meal/1")
          .set("authorization", "Bearer " + jwt.sign({ userId: 2 }, jwtSecretKey))
          .end((err, res) => {
            res.should.be.an("object");
            let { status, message } = res.body;
            status.should.equals(403);
            message.should.be
              .a("string")
              .that.equals(
                "Meal not found or not authorized"
              );
            done();
          });
      });
      it("TC-305-4 maaltijd bestaat niet", (done) => {
        chai
          .request(server)
          .delete("/api/meal/0")
          .set("authorization", "Bearer " + jwt.sign({ userId: 1 }, jwtSecretKey))
          .end((err, res) => {
            res.should.be.an("object");
            let { status, message } = res.body;
            status.should.equals(404);
            message.should.be
              .a("string")
              .that.equals("Meal not found");
            done();
          });
      });
  
      it("TC-305-5 maaltijd verwijderd", (done) => {
        chai
          .request(server)
          .delete("/api/meal/1")
          .set("authorization", "Bearer " + jwt.sign({ userId: 1 }, jwtSecretKey))
          .end((err, res) => {
            res.should.be.an("object");
            let { status, message } = res.body;
            status.should.equals(200);
            message.should.be
              .a("string")
              .that.equals("Meal has been deleted");
            done();
          });
      });
    });
  });