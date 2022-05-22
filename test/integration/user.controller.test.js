const chai = require("chai");
const chaiHttp = require("chai-http");
const server = require("../../index");
let database = [];

chai.should();
chai.use(chaiHttp);

describe("Manage users", () => {
  describe("UC-201 Registreren als nieuwe gebruiker /api/user", () => {
    beforeEach((done) => {
      database = [];
      done();
    });
    it("TC-201-1 Verplicht veld ontbreekt, een gepaste error word terug gestuurd", (done) => {
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
    it("TC-201-5 Gebruiker succesvol geregistreerd", (done) => {
      chai
        .request(server)
        .post("/api/user")
        .send({
          firstName: "Mark",
          lastName: "Doe",
          street: "Lovensdijkstraat 61",
          city: "Breda",
          password: "secret",
          emailAdress: "m.doe@server.com",
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
  // describe("UC-203 Gebruikersprofiel opvragen /api/user/:Id", () => {
  //   beforeEach((done) => {
  //     database = [];
  //     done();
  //   });
  //   it("TC-203-1 Ongeldige token, een gepaste error word terug gestuurd", (done) => {
  //     chai.request(server).get("/api/user/:Id");
  //     const Id = req.params.Id;
  //     console.log(`User met ID ${Id} gezocht`);
  //     let user = database
  //       .filter((item) => item.id == Id)
  //       .send({ Id })
  //       .end((err, res) => {
  //         res.should.be.an("object");
  //         let { status, result } = res.body;
  //         status.should.equals(401);
  //         result.should.be
  //           .a("string")
  //           .that.equals("User with ID" + Id + "not found");
  //         done();
  //       });
  //   });
  //   it("TC-203-2 Valide token en gebruiker bestaat, een gepaste error word terug gestuurd", (done) => {
  //     chai.request(server).get("/api/user/:Id");
  //     const Id = req.params.Id;
  //     console.log(`User met ID ${Id} gezocht`);
  //     let user = database
  //       .filter((item) => item.id == Id)
  //       .send({ Id })
  //       .end((err, res) => {
  //         res.should.be.an("object");
  //         let { status, result } = res.body;
  //         status.should.equals(200);
  //         result.should.be.an("array").that.equals(user);
  //         done();
  //       });
  //   });
  // });
});
