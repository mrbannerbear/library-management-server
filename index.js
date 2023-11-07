import { MongoClient, ObjectId, ServerApiVersion } from 'mongodb'
import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import jwt from 'jsonwebtoken'
import cookieParser from 'cookie-parser'

// Creating an express application
const app = express()

// Setting port
const port = process.env.PORT || 4000

// Middlewares
app.use(express.json())
dotenv.config()
app.use(cookieParser())
app.use(cors({
    origin: ["http://localhost:5173"],
    credentials: true
}))

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

const database = client.db("library")
const categories = database.collection("categories")
const books = database.collection("books")

app.get("/", (req, res) => {
    res.send("RUNNING")
})

async function run() {
  try {


       // token api
       app.post("/jwt", async(req, res) => {
        const user = req.body
        const token = jwt.sign(user, process.env.TOKEN_KEY, { expiresIn: "5h" })
        res
        .cookie("accessToken", token, {
            httpOnly: true,
            secure: "false",
            sameSite: "none"
        })
        .send({success: true})
    })

    app.post("/logout",  async(req, res) => {
        const body = req.body
        res
        .clearCookie("token", { maxAge: 0 })
        .send({loggedOut: true})
    })

    // books api
    app.get("/categories", async(req, res) => {
        // const query = req.query
        const result = await categories.find().toArray()
        res.send(result)

    })

    app.get("/books", async(req, res) => {
        const id = req.query.id
        const category = req.query.category
        let query = {}
        if(id){
            query = { _id: new ObjectId(id) }
        }
        if(category){
            query = { Category: category }
        }
        const result = await books.find(query).toArray()
        res.send(result)
    })

    app.post("/books", async(req, res) => {
        const body = req.body
        const result = await books.insertOne(body)
        res.send(result)
    })

    app.put("/books", async(req, res) => {
        const id = req.query.id
        const filter = { _id: new ObjectId(id) }
        const body = req.body

        const updatedBody = {
            $set: {
                Name: body.Name,
                "Author Name": body["Author Name"], 
                Rating: body.Rating, 
                Image: body.Image,  
                "Short description": body["Short description"],
                Category: body.Category
            }
        }
        const result = await books.updateOne(filter, updatedBody)
        res.send(result)
    })


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
