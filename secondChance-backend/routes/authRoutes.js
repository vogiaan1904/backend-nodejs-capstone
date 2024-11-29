const express = require("express");
const router = express.Router();
const connectToDatabase = require("../models/db");
const bcryptjs = require("bcryptjs");
require("dotenv").config();
const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET;
const { body, validationResult } = require("express-validator");
const pino = require("pino");
const logger = pino();

router.post("/register", async (req, res, next) => {
  try {
    const db = await connectToDatabase();
    const collection = db.collection("users");
    const { email, firstName, lastName, password } = req.body;
    const existingEmail = await collection.findOne({ email: email });
    if (existingEmail) {
      logger.error("Email id already exists");
      return res.status(400).json({ error: "Email id already exists" });
    }

    const salt = bcryptjs.genSaltSync(10);
    const hash = await bcryptjs.hash(password, salt);

    const newUser = await collection.insertOne({
      email: email,
      firstName: firstName,
      lastName: lastName,
      password: hash,
      createdAt: new Date(),
    });

    const payload = {
      user: {
        id: newUser.insertedId,
      },
    };

    const authtoken = jwt.sign(payload, JWT_SECRET);

    logger.info("User registered successfully");
    res.json({ authtoken, email });
  } catch (e) {
    next(e);
    return res.status(500).send("Internal server error");
  }
});

router.post("/login", async (req, res, next) => {
  try {
    const db = await connectToDatabase();
    const collection = db.collection("users");
    const { email, password } = req.body;
    const user = await collection.findOne({
      email: email,
    });

    if (!user) {
      logger.error("User not found");
      return res.status(404).json({ error: "User not found" });
    }

    const isMatch = await bcryptjs.compare(password, user.password);
    if (!isMatch) {
      logger.error("Passwords do not match");
      return res.status(400).json({ error: "Wrong pasword" });
    }

    const payload = {
      user: {
        id: user._id.toString(),
      },
    };
    const userName = user.firstName;
    const userEmail = user.email;
    const authtoken = jwt.sign(payload, JWT_SECRET);
    logger.info("User logged in successfully");
    return res.status(200).json({ authtoken, userName, userEmail });
  } catch (e) {
    next(e);
    return res.status(500).send("Internal server error");
  }
});

router.put("/update", async (req, res, next) => {
  try {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      logger.error("Validation errors in update request", errors.array());
      return res.status(400).json({ errors: errors.array() });
    }

    const email = req.headers.email;

    if (!email) {
      logger.error("Email not found in the request headers");
      return res
        .status(400)
        .json({ error: "Email not found in the request headers" });
    }

    const db = await connectToDatabase();
    const collection = db.collection("users");

    const existingUser = await collection.findOne({ email });

    if (!existingUser) {
      logger.error("User not found");
      return res.status(404).json({ error: "User not found" });
    }

    existingUser.firstName = req.body.name;
    existingUser.updatedAt = new Date();

    const updatedUser = await collection.findOneAndUpdate(
      { email },
      { $set: existingUser },
      { returnDocument: "after" }
    );

    const payload = {
      user: {
        id: updatedUser._id.toString(),
      },
    };

    const authtoken = jwt.sign(payload, JWT_SECRET);
    logger.info("User updated successfully");
    return res.status(200).json({ authtoken });
  } catch (e) {
    next(e);
    return res.status(500).send("Internal server error");
  }
});

module.exports = router;
