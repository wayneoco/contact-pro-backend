const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const contactSchema = new Schema({
  image: { type: String },
  fullName: { type: String },
  firstName: { type: String },
  lastName: { type: String },
  jobTitle: { type: String },
  company: { type: String },
  email: { type: String },
  phoneMobile: { type: String },
  website: { type: String },
  notes: { type: String },
  favorite: { type: Boolean, default: false },
  tracked: { type: Boolean, default: false },
  tags: [
    new Schema({
      title: String,
    }),
  ],
  lastContact: { type: Date },
  nextContact: { type: Date },
  contactFrequency: { type: String },
  dateCreated: { type: Date },
  dateModified: { type: Date },
  owner: { type: mongoose.Types.ObjectId, required: true, ref: "User" },
});

module.exports = mongoose.model("Contact", contactSchema);
