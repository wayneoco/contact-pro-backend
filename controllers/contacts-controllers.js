const { validationResult } = require("express-validator");
const fs = require("fs");
const mongoose = require("mongoose");

const HttpError = require("../models/http-error");
const Contact = require("../models/contact");
const User = require("../models/user");

const getContactsByUserId = async (req, res, next) => {
  const userId = req.params.uid;

  let user;
  try {
    user = await User.findOne({ _id: userId }).populate("contacts");
  } catch (err) {
    console.error(err);
    return next(
      new HttpError("Could not find a user for the provided userId.", 500)
    );
  }

  // console.log(user);

  // if (!user || user.contacts.length === 0) {
  //   return next(
  //     new HttpError("Could not find any contacts for the provided userId.", 404)
  //   );
  // }

  res.json({
    contacts: user.contacts.map((contact) =>
      contact.toObject({ getters: true })
    ),
  });
};

const getContactById = async (req, res, next) => {
  const contactId = req.params.cid;

  let contact;
  try {
    contact = await Contact.findById(contactId);
  } catch {
    return next(
      new HttpError("Something went wrong. Could not find contact.", 500)
    );
  }

  if (!contact) {
    return next(
      new HttpError("Could not find contact for the provided ID.", 404)
    );
  }

  res.json({ contact: contact.toObject({ getters: true }) });
};

const createContact = async (req, res, next) => {
  // const errors = validationResult(req);
  // if (!errors.isEmpty()) {
  //   return next(
  //     new HttpError("Invalid inputs passed. Please check your data.", 422)
  //   );
  // }

  let user;

  try {
    user = await User.findOne({ auth0Id: req.body.ownerAuth0Id });
  } catch {
    return next(
      new HttpError("Creating contact failed. Please try again.", 500)
    );
  }

  if (!user) {
    return next(new HttpError("Count not find user for provided ID.", 404));
  }

  const contactProps = {};

  for (const prop in req.body) {
    if (prop !== "tags" && prop !== "ownerAuth0Id") {
      contactProps[prop] = req.body[prop];
    }
  }

  if (req.body.tags.length > 0) {
    contactProps.tags = JSON.parse(req.body.tags);
  }

  contactProps.fullName = `${req.body.firstName} ${req.body.lastName}`;
  contactProps.image = req.file ? req.file.path : "";
  contactProps.owner = user.id;
  const createdContact = new Contact(contactProps);

  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();

    await createdContact.save({ session: sess });
    user.contacts.push(createdContact);
    user.contactData.numberOfContacts += 1;

    const userTags = user.tags.map(({ title }) => title);

    createdContact.tags.forEach((tag) => {
      if (!userTags.includes(tag.title)) {
        user.tags.push(tag);
      }
    });

    await user.save({ session: sess });
    await sess.commitTransaction();
  } catch {
    return next(
      new HttpError("Could not create contact. Please try again.", 500)
    );
  }

  res.status(201).json({ contact: createdContact.toObject({ getters: true }) });
};

const updateContact = async (req, res, next) => {
  // note: 'image' is not a property on req.body; rather, image properties are
  // on req.file (this is set by Multer middleware)

  const contactId = req.params.cid;

  let contact;
  try {
    contact = await Contact.findById(contactId).populate("owner");
  } catch {
    return next(new HttpError("Could not update contact.", 500));
  }

  const prevFavoriteStatus = contact.favorite;
  const prevTrackedStatus = contact.tracked;

  if (req.file) {
    contact.image = req.file.path;
  }

  if (req.body.firstName && req.body.lastName) {
    contact.fullName = `${req.body.firstName} ${req.body.lastName}`;
  }

  if (req.body.tags && req.body.tags.length > 0) {
    contact.tags = JSON.parse(req.body.tags);
  }

  // frozenKeys are keys that are not updated and therefore skipped when updating key values
  // in the for loop
  const frozenKeys = ["id", "_id", "_v", "ownerId", "dateCreated"];

  for (const prop in req.body) {
    if (frozenKeys.includes(prop)) next;

    if (prop !== "fullName" && prop !== "tags") {
      contact[prop] = req.body[prop];
    }
  }

  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();

    if (req.body.favorite !== undefined) {
      const increaseUserFavoriteCount =
        !prevFavoriteStatus && req.body.favorite;
      const decreaseUserFavoriteCount =
        prevFavoriteStatus && !req.body.favorite;

      if (increaseUserFavoriteCount) {
        contact.owner.contactData.numberOfFavorites += 1;
      } else if (decreaseUserFavoriteCount) {
        contact.owner.contactData.numberOfFavorites -= 1;
      }
    }

    if (req.body.tracked !== undefined) {
      const increaseUserTrackedCount = req.body.tracked && !prevTrackedStatus;
      const decreaseUserTrackedCount = prevTrackedStatus && !req.body.tracked;

      if (increaseUserTrackedCount) {
        contact.owner.contactData.numberOfTracked += 1;
      } else if (decreaseUserTrackedCount) {
        contact.owner.contactData.numberOfTracked -= 1;
      }
    }

    await contact.save({ session: sess });
    await contact.owner.save({ session: sess });
    await sess.commitTransaction();
  } catch (err) {
    console.log(err);
    return next(
      new HttpError("Could not update contact. Please try again.", 500)
    );
  }

  res.status(201).json({ contact: contact.toObject({ getters: true }) });
};

const deleteContact = async (req, res, next) => {
  const contactId = req.params.cid;

  let contact;
  try {
    contact = await Contact.findById(contactId).populate("owner");
  } catch (err) {
    console.log(err);
    return next(
      new HttpError("An error occurred. Please try again later.", 500)
    );
  }

  if (!contact) {
    return next(new HttpError("Could not find a contact with that ID.", 404));
  }

  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();

    contact.owner.contacts.pull(contact);
    contact.owner.contactData.numberOfContacts -= 1;

    if (contact.favorite) {
      contact.owner.contactData.numberOfFavorites -= 1;
    }

    if (contact.tracked) {
      contact.owner.contactData.numberOfTracked -= 1;
    }

    await contact.owner.save({ session: sess });
    await contact.remove({ session: sess });
    await sess.commitTransaction();
  } catch (err) {
    console.log(err);
    return next(new HttpError("Could not delete contact.", 500));
  }

  const imagePath = contact.image;

  if (imagePath) {
    fs.unlink(imagePath, (err) => {
      console.log(err);
    });
  }

  res.status(200).json({ message: "Deleted contact." });
};

exports.getContactById = getContactById;
exports.getContactsByUserId = getContactsByUserId;
exports.createContact = createContact;
exports.updateContact = updateContact;
exports.deleteContact = deleteContact;
