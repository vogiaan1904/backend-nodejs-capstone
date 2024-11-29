const express = require("express");
const router = express.Router();
const connectToDatabase = require("../models/db");
const bcryptjs = require("bcryptjs");
require("dotenv").config();
const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET;
const logger = require("../logger");
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
  }
});

module.exports = router;
