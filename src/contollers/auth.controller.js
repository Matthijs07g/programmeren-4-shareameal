const assert = require("assert");
const jwt = require("jsonwebtoken");
const dbconnection = require("../../database/dbconnection");
const logger = require("../config/config").logger;
const jwtSecretKey = require("../config/config").jwtSecretKey;

module.exports = {
  login(req, res, next) {
    dbconnection.getConnection((err, connection) => {
      if (err) throw err;
      if (connection) {
        connection.query(
          "SELECT `id`, `emailAdress`, `password`, `firstName`, `lastName` FROM `user` WHERE `emailAdress` = ?",
          [req.body.emailAdress],
          (err, rows, fields) => {
            connection.release();
            if (err) {
              res.status(404).json({
                status: 404,
                message: "user not found",
              });
            }
            if(rows.length<1){
              res.status(404).json({
                status: 404,
                message: "user not found",
              });
            }else{
            if (rows) {
              if (
                rows &&
                rows.length === 1 &&
                rows[0].password == req.body.password
              ) {
                logger.info(
                  "passwords DID match, sending userinfo and valid token"
                );
                const { password, ...userinfo } = rows[0];
                // Create an object containing the data we want in the payload.
                const payload = {
                  userId: userinfo.id,
                };

                jwt.sign(
                  payload,
                  jwtSecretKey,
                  { expiresIn: "12d" },
                  function (err, token) {
                    logger.debug("User logged in, sending: ", userinfo);
                    res.status(200).json({
                      status: 200,
                      result: { ...userinfo, token },
                    });
                  }
                );
              } else {
                logger.info("User not found or password invalid");
                res.status(400).json({
                  status: 400,
                  message: "password invalid",
                });
              }
            }
            }
          }
        );
      }
    });
  },

  validateLogin(req, res, next) {
    try {
      assert(typeof req.body.emailAdress === "string", "email must be a string");
      assert(typeof req.body.password === "string", "password must be a string");
      next();
    } catch (err) {
      const error = {
        status: 400,
        result: err.message,
      };
      next(error);
    }
  },

  validateToken(req, res, next) {
    logger.info("validateToken called");
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      logger.warn("Authorization header missing!");
      res.status(401).json({
        error: "Authorization header missing!",
        status: 401,
      });
    } else {
      // Strip the word 'Bearer ' from the headervalue
      const token = authHeader.substring(7, authHeader.length);

      jwt.verify(token, jwtSecretKey, (err, payload) => {
        if (err) {
          logger.warn("Not authorized");
          res.status(401).json({
            error: "Not authorized",
            status: 401,
          });
        }
        if (payload) {
          logger.debug("token is valid", payload);
          // User heeft toegang. Voeg UserId uit payload toe aan
          // request, voor ieder volgend endpoint.
          req.userId = payload.userId;
          next();
        }
      });
    }
  },
};
