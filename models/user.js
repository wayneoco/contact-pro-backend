const mongoose = require("mongoose");
const uniqueValidator = require("mongoose-unique-validator");

const Schema = mongoose.Schema;

const userSchema = new Schema({
  image: { type: String, default: "" },
  firstName: { type: String, default: "" },
  lastName: { type: String, default: "" },
  email: { type: String, required: true, unique: true },
  auth0Id: { type: String, required: true, unique: true },
  contacts: {
    type: [mongoose.Types.ObjectId],
    default: [],
    ref: "Contact",
  },
  // contacts: [{ type: mongoose.Types.ObjectId, ref: "Contact" }],
  tags: {
    type: [{ title: String }],
    default: [{ title: "family" }, { title: "friend" }, { title: "work" }],
  },
  contactData: {
    numberOfContacts: { type: Number, default: 0 },
    numberOfFavorites: { type: Number, default: 0 },
    numberOfTracked: { type: Number, default: 0 },
  },
  settings: {
    contactFrequency: {
      frequent: {
        number: { type: Number, default: 3 },
        unit: { type: String, default: "weeks" },
      },
      moderate: {
        number: { type: Number, default: 6 },
        unit: { type: String, default: "weeks" },
      },
      occasional: {
        number: { type: Number, default: 12 },
        unit: { type: String, default: "weeks" },
      },
    },
  },
  token: { type: String },
});

userSchema.plugin(uniqueValidator);

module.exports = mongoose.model("User", userSchema);
