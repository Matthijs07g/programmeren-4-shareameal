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
const { expect } = require("chai")

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
  "INSERT INTO `user` (`id`, `firstName`, `lastName`, `emailAdress`, `password`, `street`, `city`,'isActive' ) VALUES" +
  '(1, "first", "last", "name@server.nl", "secret", "street", "city", "1"),'+
  "(2, 'abc', 'def', 'test@test.nl', 'secret', 'street', 'city', '0' )";

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
          phoneNumber: "",
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
          phoneNumber: "",
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
  describe("UC-202 Overzicht van gebruikers", () => {
    beforeEach((done) => {
      logger.debug("userTests: beforeEach called.");
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

    it("TC-202-1 toon nul gebruikers", (done) => {
      chai
        .request(server)
        .get("/api/user?count=0")
        //.set("authorization", "Bearer " + jwt.sign({ userId: 1 }, jwtSecretKey))
        .end((err, res) => {
          res.should.be.an("object");
          let { status, result } = res.body;
          status.should.equals(200);
          result.should.be.an("array").that.is.empty;
          done();
        });
    });

    it("TC-202-2 toon 2 gebruikers", (done) => {
      chai
        .request(server)
        .get("/api/user?count=2")
        // .set("authorization", "Bearer " + jwt.sign({ userId: 1 }, jwtSecretKey))
        .end((err, res) => {
          res.should.be.an("object");
          let { status, result } = res.body;
          status.should.equals(200);
          result.should.be.an("array");
          expect(result).to.have.lengthOf(2);
          done();
        });
    });

    it("TC-202-3 toon gebruikers met zoekterm op niet bestaande naam", (done) => {
      chai
        .request(server)
        .get("/api/user?firstName=aaaaa")
        // .set("authorization", "Bearer " + jwt.sign({ userId: 1 }, jwtSecretKey))
        .end((err, res) => {
          res.should.be.an("object");
          let { status, result } = res.body;
          status.should.equals(200);
          result.should.be.an("array");
          expect(result).to.have.lengthOf(0);
          done();
        });
    });

    it("TC-202-4 toon gebruikers met isActive = false.", (done) => {
      chai
        .request(server)
        .get("/api/user?isActive=0")
        // .set("authorization", "Bearer " + jwt.sign({ userId: 1 }, jwtSecretKey))
        .end((err, res) => {
          res.should.be.an("object");
          let { status, result } = res.body;
          status.should.equals(200);
          result.should.be.an("array");
          expect(result).to.have.lengthOf(1);
          done();
        });
    });

    it("TC-202-5 toon gebruikers met isActive = true.", (done) => {
      chai
        .request(server)
        .get("/api/user?isActive=1")
        // .set("authorization", "Bearer " + jwt.sign({ userId: 1 }, jwtSecretKey))
        .end((err, res) => {
          res.should.be.an("object");
          let { status, result } = res.body;
          status.should.equals(200);
          result.should.be.an("array");
          expect(result).to.have.lengthOf(1);
          done();
        });
    });

    it("TC-202-6 toon gebruiker met bestaande naam", (done) => {
      chai
        .request(server)
        .get("/api/user?firstName=first")
        // .set("authorization", "Bearer " + jwt.sign({ userId: 1 }, jwtSecretKey))
        .end((err, res) => {
          res.should.be.an("object");
          let { status, result } = res.body;
          status.should.equals(200);
          result.should.be.an("array");
          expect(result).to.have.lengthOf(1);
          result[0].should.be.an("object").that.contains({
            id: 1,
            firstName: "first",
            lastName: "last",
            isActive: result[0].isActive,
            emailAdress: "name@server.nl",
            password: "secret",
            phoneNumber: "",
            street: "street",
            city: "city",
          });
          done();
        });
    });
  });

  describe("UC-203 get Profile", () => {
    beforeEach((done) => {
      logger.debug("userTests: beforeEach called.");
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

    it("TC-203-1 unvalid token", (done) => {
      chai
        .request(server)
        .get(`/api/user/profile`)
        // .set("authorization", "Bearer " + jwt.sign({ userId: 2 }, jwtSecretKey) + "AN_UNVALID_PART")
        .end((err, res) => {
          res.should.be.an("object");
          let { status, message } = res.body;
          status.should.equals(401);
          message.should.be.a("string").that.equals(`Not authorized`);
          done();
        });
    });

    it("TC-203-2 valid token", (done) => {
      chai
        .request(server)
        .get(`/api/user/profile`)
        // .set("authorization", "Bearer " + jwt.sign({ userId: 1 }, jwtSecretKey))
        .end((err, res) => {
          res.should.be.an("object");
          let { status, result } = res.body;
          status.should.equals(200);
          result.should.be.a("object").that.contains({
            id: result.id,
            firstName: "Quincy",
            lastName: "van Deursen",
            street: "Lisdodde",
            city: "Breda",
            isActive: result.isActive,
            password: "Secret1!",
            emailAdress: "Quincyvandeursen@gmail.com",
            phoneNumber: "0612345678",
          });
          done();
        });
    });
  });

  describe("UC-204 Details van gebruiker", () => {
    beforeEach((done) => {
      logger.debug("userTests: beforeEach called.");
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
    it("TC-204-1 Ongeldig token", (done) => {
      chai
        .request(server)
        .get("/api/user/hallo")
        .end((err, res) => {
          res.should.be.an("object");
          let { status, message } = res.body;
          status.should.equals(401);
          message.should.be.a("string").that.equals("Token is invalid");
          done();
        });
    });
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
    it("TC-204-3 Gebruiker-ID bestaat", (done) => {
      chai
        .request(server)
        .get("/api/user/1")
        .end((err, res) => {
          res.should.be.an("object");
          let { status, message } = res.body;
          status.should.equals(200);
          message.should.be.an("object").that.contains({  
          id: 1,
          firstName: "first",
          lastName: "last",
          isActive: 1,
          emailAdress: "name@server.nl",
          password: "secret",
          roles: "editor,guest",
          street: "street",
          city: "city",
        })
          done();
        });
    });
  });
  describe("UC-205 Gebruiker wijzigen", () => {
    beforeEach((done) => {
      logger.debug("userTests: beforeEach called.");
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

    it("TC-205-1 verplicht veld email ontbreekt.", (done) => {
      chai
        .request(server)
        .put(`/api/user/1`)
        // .set("authorization", "Bearer " + jwt.sign({ userId: 2 }, jwtSecretKey))
        .send({
          firstName: "Matthijs",
          lastName: "van Gastel",
          street: "lovendijk",
          city: "Breda",
          isActive: true,
          password: "Secret1",
          phoneNumber: "0612345678",
        })
        .end((err, res) => {
          res.should.be.an("object");
          let { status, message } = res.body;
          status.should.equals(400);
          message.should.be.a("string").that.equals("emailaddress must be of type string");
          done();
        });
    });

    it("TC-205-3 niet-valide telefoonnummer.", (done) => {
      chai
        .request(server)
        .put(`/api/user/1`)
        // .set("authorization", "Bearer " + jwt.sign({ userId: 2 }, jwtSecretKey))
        .send({
          firstName: "Matthijs",
          lastName: "van Gastel",
          street: "lovendijk",
          city: "Breda",
          isActive: true,
          password: "secret1",
          emailAdress: "test@server.nl",
          phoneNumber: 1,
        })
        .end((err, res) => {
          res.should.be.an("object");
          let { status, message } = res.body;
          status.should.equals(400);
          message.should.be.a("string").that.equals("Phonenumber isn't valid.");
          done();
        });
    });

    it("TC-205-4 gebruiker bestaat niet.", (done) => {
      chai
        .request(server)
        .put(`/api/user/99999999999`)
        // .set("authorization", "Bearer " + jwt.sign({ userId: 2 }, jwtSecretKey))
        .send({
          firstName: "Matthijs",
          lastName: "van Gastel",
          street: "lovendijk",
          city: "Breda",
          password: "secret1",
          emailAdress: "test@server.nl",
          phoneNumber: "0612345678",
        })
        .end((err, res) => {
          res.should.be.an("object");
          let { status, message } = res.body;
          status.should.equals(400);
          message.should.be
            .a("string")
            .that.equals(
              "User not found"
            );
          done();
        });
    });

    it("TC-205-5 niet ingelogd", (done) => {
      chai
        .request(server)
        .put(`/api/user/1`)
        .send({
          firstName: "Matthijs",
          lastName: "van Gastel",
          street: "lovendijk",
          city: "Breda",
          isActive: true,
          password: "secret1",
          emailAdress: "test@server.nl",
          phoneNumber: "0612345678",
        })
        .end((err, res) => {
          res.should.be.an("object");
          let { status, message } = res.body;
          status.should.equals(401);
          message.should.be
            .a("string")
            .that.equals("Authorization header missing!");
          done();
        });
    });
    it("TC-205-6 succesvol wijzigen", (done) => {
      chai
        .request(server)
        .put(`/api/user/1`)
        // .set("authorization", "Bearer " + jwt.sign({ userId: 2 }, jwtSecretKey))
        .send({
          firstName: "Matthijs",
          lastName: "van Gastel",
          street: "lovendijk",
          city: "Breda",
          isActive: true,
          password: "secret1",
          emailAdress: "test@server.nl",
          phoneNumber: "0612345678",
        })
        .end((err, res) => {
          res.should.be.an("object");
          let { status, result } = res.body;
          status.should.equals(200);
          result.should.be.a("object").that.contains({
          id: 1,
          firstName: "Matthijs",
          lastName: "van Gastel",
          street: "lovendijk",
          city: "Breda",
          isActive: true,
          password: "secret1",
          emailAdress: "test@server.nl",
          phoneNumber: "0612345678",
          });
          done();
        });
    });
  });

  describe("UC-206 Gebruiker verwijderen", () => {
    beforeEach((done) => {
      logger.debug("userTests: beforeEach called.");
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

    it("TC-206-1 gebruiker bestaat niet", (done) => {
      chai
        .request(server)
        .delete(`/api/user/99999999`)
        // .set("authorization", "Bearer " + jwt.sign({ userId: 1 }, jwtSecretKey))
        .end((err, res) => {
          res.should.be.an("object");
          let { status, message } = res.body;
          status.should.equals(400);
          message.should.be.a("string").that.equals(`User not found`);
          done();
        });
    });

    it("TC-206-2 not logged in.", (done) => {
      chai
        .request(server)
        .delete(`/api/user/1`)
        .end((err, res) => {
          res.should.be.an("object");
          let { status, message } = res.body;
          status.should.equals(401);
          message.should.be
            .a("string")
            .that.equals(`Authorization header missing!`);
          done();
        });
    });

    it("TC-206-3 user is niet de eigenaar", (done) => {
      chai
        .request(server)
        .delete(`/api/user/2`)
        // .set("authorization", "Bearer " + jwt.sign({ userId: 1 }, jwtSecretKey))
        .end((err, res) => {
          res.should.be.an("object");
          let { status, message } = res.body;
          status.should.equals(403);
          message.should.be
            .a("string")
            .that.equals(`Not authorized to delete the user.`);
          done();
        });
    });

    it("TC-206-4 deleting user succesfull", (done) => {
      chai
        .request(server)
        .delete(`/api/user/1`)
        .set("authorization", "Bearer " + jwt.sign({ userId: 1 }, jwtSecretKey))
        .end((err, res) => {
          res.should.be.an("object");
          let { status, result } = res.body;
          status.should.equals(200);
          result.should.be
            .a("string")
            .that.equals(`User has been deleted`);
          done();
        });
    });
  });
});
});
