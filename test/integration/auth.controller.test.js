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

  describe("Login", () => {
    describe("UC-101, login /auth/login ", () => {
      beforeEach((done) => {
        logger.debug("loginTests: beforeEach called.");
        dbconnection.getConnection(function (err, connection) {
          if (err) throw err; // not connected!
          connection.query(
            CLEAR_DB + INSERT_USER,
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
  
      it("TC-101-1 verplicht veld ontbreekt", (done) => {
        chai
          .request(server)
          .post("/auth/login")
          .send({
            emailAdress: "name@server.nl",
          })
          .end((err, res) => {
            res.should.be.an("object");
            let { status, result } = res.body;
            status.should.equals(400);
            result.should.be
              .a("string")
              .that.equals("password must be a string");
            done();
          });
      });
  
      it("TC-101-2 niet valide email", (done) => {
        chai
          .request(server)
          .post("/auth/login")
          .send({
            emailAdress: 1,
            password: "secret",
          })
          .end((err, res) => {
            res.should.be.an("object");
            let { status, result } = res.body;
            status.should.equals(400);
            result.should.be.a("string").that.equals("email must be a string");
            done();
          });
      });
  
      it("TC-101-3 niet valide wachtwoord", (done) => {
        chai
          .request(server)
          .post("/auth/login")
          .send({
            emailAdress: "name@server.nl",
            password: "test",
          })
          .end((err, res) => {
            res.should.be.an("object");
            let { status, message } = res.body;
            status.should.equals(400);
            message.should.be
              .a("string")
              .that.equals(
                "password invalid"
              );
            done();
          });
      });
  
      it("TC-101-4 gebruiker bestaat niet", (done) => {
        chai
          .request(server)
          .post("/auth/login")
          .send({
            emailAdress: "1234@server.nl",
            password: "secret",
          })
          .end((err, res) => {
            res.should.be.an("object");
            let { status, message } = res.body;
            status.should.equals(404);
            message.should.be
              .a("string")
              .that.equals("user not found");
            done();
          });
      });
      it("TC-101-5 succesvol ingelogd", (done) => {
        chai
          .request(server)
          .post("/auth/login")
          .send({
            emailAdress: "name@server.nl",
            password: "secret",
          })
          .end((err, res) => {
            res.should.be.an("object");
            let { status, result } = res.body;
            status.should.equals(200);
            result.should.be.a("object").that.contains({
              id: result.id,
              emailAdress: "name@server.nl",
              password: "secret",
              firstName: "first",
              lastName: "last",
              
              token: result.token,
            });
            done();
          });
      });
    });
  });