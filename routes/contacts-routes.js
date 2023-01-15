const { Router } = require("express");
const router = Router();
const { check } = require("express-validator");

const contactsController = require("../controllers/contacts-controllers");
const fileUpload = require("../middleware/file-upload");

// router.get("/", contactsController.getFavorites);
router.get("/user/:uid", contactsController.getContactsByUserId);
router.get("/:cid", contactsController.getContactById);
router.post(
  "/",
  fileUpload.single("image"),
  // [
  //   check("first-name").not().isEmpty(),
  //   check("last-name").not().isEmpty(),
  //   check("email").isEmail(),
  //   check("phone-mobile").isNumeric().isLength({ min: 10, max: 10 }),
  // ],
  contactsController.createContact
);
router.patch(
  "/:cid",
  fileUpload.single("image"),
  // [
  //   check("first-name").not().isEmpty(),
  //   check("last-name").not().isEmpty(),
  //   check("phone-mobile").isNumeric().isLength({ min: 10, max: 10 }),
  //   check("phone-home").isNumeric().isLength({ min: 10, max: 10 }),
  //   check("phone-work").isNumeric().isLength({ min: 10, max: 10 }),
  //   check("phone-main").isNumeric().isLength({ min: 10, max: 10 }),
  //   check("email-home").isEmail(),
  //   check("email-work").isEmail(),
  // ],
  contactsController.updateContact
);
router.delete("/:cid", contactsController.deleteContact);

module.exports = router;
