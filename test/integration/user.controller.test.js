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
    it("Verplicht veld ontbreekt, een gepaste error word terug gestuurd", (done) => {
      chai
        .request(server)
        .post("/api/movie")
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
  });
});
