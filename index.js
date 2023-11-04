import { MongoClient, ServerApiVersion } from 'mongodb'
import dotenv from 'dotenv/config'

dotenv.config()

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@library0.kdbnrjn.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
  }
}
run().catch(console.dir);
