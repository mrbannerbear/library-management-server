import { MongoClient, ServerApiVersion } from 'mongodb'
import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import jwt from 'jsonwebtoken'

// Creating an express application
const app = express()

// Setting port
const port = process.env.PORT || 4000

// Middlewares
app.use(express.json())
app.use(cors())
dotenv.config()

// Mongodb uri
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@library0.kdbnrjn.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

app.get("/", (req, res) => {
    res.send("RUNNING")
})

async function run() {
  try {
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
  }
}

app.listen(port, () => {
    console.log(port, "running")
})

run().catch(console.dir);
