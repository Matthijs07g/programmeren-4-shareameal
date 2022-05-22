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
  "INSERT INTO `user` (`id`, `firstName`, `lastName`, `emailAdress`, `password`, `street`, `city` ) VALUES" +
  '(1, "first", "last", "name@server.nl", "secret", "street", "city");';

/**
 * Query om twee meals toe te voegen. Let op de cookId, die moet matchen
 * met een bestaande user in de database.
 */
const INSERT_MEALS =
  "INSERT INTO `meal` (`id`, `name`, `description`, `imageUrl`, `dateTime`, `maxAmountOfParticipants`, `price`, `cookId`) VALUES" +
  "(1, 'Meal A', 'description', 'image url', NOW(), 5, 6.50, 1)," +
  "(2, 'Meal B', 'description', 'image url', NOW(), 5, 6.50, 1);";

describe("Manage users", () => {
  describe("UC-201 Registreren als nieuwe gebruiker /api/user", () => {
    beforeEach((done) => {
      dbconnection.getConnection(function (err, connection) {
        if (err) throw err; // not connected!

        // Use the connection
        connection.query(
          CLEAR_DB + INSERT_USER,
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
    it("TC-201-1 Verplicht veld ontbreekt", (done) => {
      chai
        .request(server)
        .post("/api/user")
        .send({
          firstName: "Mark",
          lastName: "Doe",
          street: "Lovensdijkstraat 61",
          city: "Breda",
          password: "secret",
          //emailAdress ontbreekt
        })
        .end((err, res) => {
          res.should.be.an("object");
          let { status, result } = res.body;
          status.should.equals(400);
          result.should.be
            .a("string")
            .that.equals("Emailadress must be a string");
          done();
        });
    });
    it("TC-201-2 Niet-valide email adres", (done) => {
      chai
        .request(server)
        .post("/api/user")
        .send({
          firstName: "Mark",
          lastName: "Doe",
          street: "Lovensdijkstraat 61",
          city: "Breda",
          password: "secret",
          emailAdress: 1,
        })
        .end((err, res) => {
          res.should.be.an("object");
          let { status, result } = res.body;
          status.should.equals(400);
          result.should.be
            .a("string")
            .that.equals("Emailadress must be a string");
          done();
        });
    });
    it("TC-201-3 niet valide wachtwoord", (done) => {
      chai
        .request(server)
        .post("/api/user")
        .send({
          firstName: "Mark",
          lastName: "Doe",
          street: "Lovensdijkstraat 61",
          city: "Breda",
          password: 1,
          emailAdress: "m.doe@server.com",
        })
        .end((err, res) => {
          res.should.be.an("object");
          let { status, result } = res.body;
          status.should.equals(400);
          result.should.be.a("string").that.equals("Password must be a string");
          done();
        });
    });
    it("TC-201-4 Gebruiker bestaat al", (done) => {
      chai
        .request(server)
        .post("/api/user")
        .send({
          firstName: "Mark",
          lastName: "Doe",
          street: "Lovensdijkstraat 61",
          city: "Breda",
          password: "secret",
          emailAdress: "name@server.nl",
        })
        .end((err, res) => {
          res.should.be.an("object");
          let { status, message } = res.body;
          status.should.equals(409);
          message.should.be.a("string").that.equals("User already exists");
          done();
        });
    });
    it("TC-201-5 Gebruiker succesvol geregistreerd", (done) => {
      chai
        .request(server)
        .post("/api/user")
        .send({
          firstName: "Peter",
          lastName: "Janssen",
          street: "Lovensdijkstraat 61",
          city: "Breda",
          password: "secret",
          emailAdress: "p.janssen@server.com",
        })
        .end((err, res) => {
          res.should.be.an("object");
          let { status, result } = res.body;
          status.should.equals(201);
          result.should.be.an("array");
          done();
        });
    });
  });
  describe("UC-204 Details van gebruiker /api/user/:Id", () => {
    beforeEach((done) => {
      dbconnection.getConnection(function (err, connection) {
        if (err) throw err; // not connected!

        // Use the connection
        connection.query(
          CLEAR_DB + INSERT_USER,
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
    // it("TC-204-1 Ongeldig token", (done) => {
    //   chai
    //     .request(server)
    //     .get("/api/user/hallo")
    //     .end((err, res) => {
    //       res.should.be.an("object");
    //       let { status, message } = res.body;
    //       status.should.equals(401);
    //       message.should.be.a("string").that.equals("Token is invalid");
    //       done();
    //     });
    // });
    it("TC-204-2 Gebruiker-ID bestaat niet", (done) => {
      chai
        .request(server)
        .get("/api/user/69")
        .end((err, res) => {
          res.should.be.an("object");
          let { status, message } = res.body;
          status.should.equals(404);
          message.should.be.a("string").that.equals("user not found");
          done();
        });
    });
    // it("TC-204-3 Gebruiker-ID bestaat", (done) => {
    //   chai
    //     .request(server)
    //     .get("/api/user/1")
    //     .end((err, res) => {
    //       res.should.be.an("object");
    //       let { status, message } = res.body;
    //       status.should.equals(200);
    //       message.should.be.an("array");
    //       done();
    //     });
    // });
  });
});
