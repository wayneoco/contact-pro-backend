const express = require("express");
const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
const cors = require("cors");
const { auth } = require("express-oauth2-jwt-bearer");
require("dotenv").config();

const contactsRoutes = require("./routes/contacts-routes");
const userRoutes = require("./routes/user-routes");
const HttpError = require("./models/http-error");

const app = express();
const checkJwt = auth({
  audience: process.env.AUDIENCE,
  issuerBaseURL: process.env.ISSUER_BASE_URL,
});

app.use(express.json());

app.use("/uploads/images", express.static(path.join("uploads", "images")));

// app.use((req, res, next) => {
//   res.setHeader("Access-Control-Allow-Origin", "*");
//   res.setHeader(
//     "Access-Control-Allow-Headers",
//     "Origin, X-Requested-With, Content-Type, Accept, Authorization"
//   );
//   res.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE");

//   next();
// });

app.use(
  cors({
    origin: "*",
    methods: "GET, POST, PATCH, DELETE",
  })
);

app.use("/api/contacts", checkJwt, contactsRoutes);
app.use("/api/user", checkJwt, userRoutes);

app.use((req, res, next) => {
  next(new HttpError("Cound not find this route.", 404));
});

app.use((error, req, res, next) => {
  if (req.file) {
    fs.unlink(req.file.path, (err) => {
      console.log(err);
    });
  }

  if (res.headerSent) return next(error);

  res.status(error.code || 500);
  res.json({ message: error.message || "An unknown error occurred." });
});

mongoose
  .connect(
    `mongodb+srv://admin:y0OPrFf0KElbk4g8@contactpro.7xv12wp.mongodb.net/test?retryWrites=true&w=majority`
  )
  .then(() => {
    app.listen(process.env.PORT || 5005);
  })
  .catch((err) => {
    console.log(err);
  });
