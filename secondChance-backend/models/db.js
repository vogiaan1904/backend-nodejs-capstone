// db.js
require("dotenv").config();
const MongoClient = require("mongodb").MongoClient;

// MongoDB connection URL with authentication options
let url = `${process.env.MONGO_URL}`;
let dbInstance = null;
const dbName = `${process.env.MONGO_DB}`;

async function connectToDatabase() {
  if (dbInstance) {
    return dbInstance;
  }

  const client = new MongoClient(url);

  try {
    // Task 1: Connect to MongoDB
    await client.connect();
    console.log("Connected successfully to MongoDB");

    // Task 2: Connect to database giftDB and store in variable dbInstance
    dbInstance = client.db(dbName);

    process.on("SIGINT", () => {
      client.close();
      console.log("MongoDB connection closed");
      process.exit(0);
    });

    // Task 3: Return database instance
    return dbInstance;
  } catch (error) {
    console.error("Failed to connect to MongoDB", error);
    throw error;
  }
}

module.exports = connectToDatabase;
