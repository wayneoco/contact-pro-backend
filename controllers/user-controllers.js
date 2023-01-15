// const { validationResult } = require("express-validator");

const HttpError = require("../models/http-error");
const User = require("../models/user");

const createUser = async (req, res, next) => {
  // const errors = validationResult(req);
  // if (!errors.isEmpty()) {
  //   return next(new HttpError("Invalid inputs passed.", 422));
  // }

  const { firstName, lastName, email, auth0Id, image } = req.body;

  let existingUser;
  try {
    existingUser = await User.findOne({ email: email });
  } catch (err) {
    console.error(err);
    return next(
      new HttpError("User creation failed. Please try again later.", 500)
    );
  }

  if (existingUser) {
    return res.status(200).json({
      status: 200,
      message: "User already exists.",
      user: existingUser.toObject({ getters: true }),
    });
  }

  const createdUser = new User({
    firstName,
    lastName,
    email,
    auth0Id,
    image,
  });

  try {
    await createdUser.save();
  } catch (err) {
    console.error(err);
    return next(
      new HttpError("User could not be created. Please try again later.", 500)
    );
  }

  // let token;
  // try {
  //   token = jwt.sign(
  //     { auth0Id: createdUser.id, email: createdUser.email },
  //     process.env.JWT_KEY,
  //     { expiresIn: "1h" }
  //   );
  // } catch {
  //   return next(new HttpError("Sign up failed. Please try again later.", 500));
  // }

  res.status(201).json({ user: createdUser.toObject({ getters: true }) });
};

const updateUserToken = async (req, res, next) => {
  const { email, token } = req.body;

  let existingUser;
  try {
    existingUser = await User.findOne({ email: email });
    existingUser.token = token;
  } catch (err) {
    console.error(err);
    return next(
      new HttpError("User creation failed. Please try again later.", 500)
    );
  }

  try {
    await existingUser.save();
  } catch (err) {
    console.error(err);
    return next(
      new HttpError("User could not be updated. Please try again later.", 500)
    );
  }

  res.status(201).json({ user: existingUser.toObject({ getters: true }) });
};

const getUserById = async (req, res, next) => {
  const userId = req.params.uid;

  let existingUser;
  try {
    existingUser = await User.findOne({ id: userId });
  } catch {
    return next(
      new HttpError("Could not retrieve user. Please try again later.", 500)
    );
  }

  if (!existingUser) {
    return next(new HttpError("User does not exist with the given ID.", 401));
  }

  res.json({ user: existingUser.toObject({ getters: true }) });
};

const login = async (req, res, next) => {
  const { email, password } = req.body;

  let existingUser;
  try {
    existingUser = await User.findOne({ email: email });
  } catch {
    return next(new HttpError("Login.failed. Please try again later.", 500));
  }

  if (!existingUser) {
    return next(new HttpError("Credentials could not log you in.", 401));
  }

  let isValidPassword;
  try {
    isValidPassword = await bcrypt.compare(password, existingUser.password);
  } catch {
    return next(
      new HttpError("Could not log you in. Please check your credentials", 500)
    );
  }

  if (!isValidPassword) {
    return next(new HttpError("Invalid credentials.", 401));
  }

  let token;
  try {
    token = jwt.sign(
      { auth0Id: existingUser.id, email: existingUser.email },
      process.env.JWT_KEY,
      { expiresIn: "1h" }
    );
  } catch {
    return next(new HttpError("Login failed. Please try again later.", 500));
  }

  res.status(200).json({
    auth0Id: existingUser.id,
    email: existingUser.email,
    token: token,
  });
};

exports.createUser = createUser;
exports.updateUserToken = updateUserToken;
exports.login = login;
exports.getUserById = getUserById;
