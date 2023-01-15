const express = require("express");
const { check } = require("express-validator");

const userControllers = require("../controllers/user-controllers");
const fileUpload = require("../middleware/file-upload");

const router = express.Router();
router.get("/:uid", userControllers.getUserById);
router.post("/", fileUpload.single("image"), userControllers.createUser);
router.patch("/:uid", userControllers.updateUserToken);

// router.post(
//   "/",
//   fileUpload.single("image"),
//   [
//     check("first-name").not().isEmpty(),
//     check("last-name").not().isEmpty(),
//     check("email").not().isEmpty().isEmail(),
//   ],
//   userControllers.signup
// );
// router.post("/login", userControllers.login);

module.exports = router;
