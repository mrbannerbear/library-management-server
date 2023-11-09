import { MongoClient, ObjectId, ServerApiVersion } from "mongodb";
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import cookieParser from "cookie-parser";

// Creating an express application
const app = express();

// Setting port
const port = process.env.PORT || 4000;

// Middlewares
app.use(express.json());
dotenv.config();
app.use(cookieParser());
app.use(
  cors({
    origin: ["http://localhost:5174"],
    credentials: true,
  })
);

const tokenVerify = async (req, res, next) => {
  const token = req.cookies?.accessToken;
  console.log(token, "token")
  if (!token) {
    return res.status(401).send({ message: "Not Authorized" });
  }
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).send({ message: "Unauthorized" });
    }
    req.user = decoded;
    next();
  });
};

// Mongodb uri
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@library0.kdbnrjn.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

const database = client.db("library");
const categories = database.collection("categories");
const books = database.collection("books");
const borrowedInfo = database.collection("borrowedInfo");

app.get("/", (req, res) => {
  res.send("RUNNING");
});

async function run() {
  try {
    // token api
    app.post("/jwt", async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.TOKEN_KEY, { expiresIn: "5h" });
      res
        .cookie("accessToken", token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production" ? true : false,
          sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
        })
        .send({ success: true });
    });

    app.post("/logout", async (req, res) => {
      const body = req.body;
      res.clearCookie(
        "accessToken",
        {
        maxAge: 0,
        secure: process.env.NODE_ENV === "production" ? true: false,
        sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
        }
        )
    });

    // books api
    app.get("/categories", async (req, res) => {
      // const query = req.query
      const result = await categories.find().toArray();
      res.send(result);
    });

    app.get("/books", async (req, res) => {
      const id = req.query.id;
      const category = req.query.category;
      let query = {};
      if (id) {
        query = { _id: new ObjectId(id) };
      }
      if (category) {
        query = { Category: category };
      }
      const result = await books.find(query).toArray();
      res.send(result);
    });

    app.post("/books", async (req, res) => {
      const body = req.body;
      const result = await books.insertOne(body);
      res.send(result);
    });

    app.put("/books", async (req, res) => {
      const id = req.query.id;
      const filter = { _id: new ObjectId(id) };
      const body = req.body;

      const existingBook = await books.findOne(filter);

      const updatedBody = {
        $set: {
          Name: body.Name || existingBook.Name,
          "Author Name": body["Author Name"] || existingBook["Author Name"],
          Rating: body.Rating || existingBook.Rating,
          Image: body.Image || existingBook.Image,
          "Short description":
            body["Short description"] || existingBook["Short description"],
          Category: body.Category || existingBook.Category,
          Quantity: body.Quantity || existingBook.Quantity,
        },
      };

      const result = await books.updateOne(filter, updatedBody);
      res.send(result);
    });

    app.get("/borrowedInfo", async (req, res) => {
      const email = req.query.email;
      const id = req.query.id
      let query = {};
      if (email && id) {
        query = {
          email: email,
          bookID: id,
        };
      } else if (email) {
        query = {
          email: email,
        };
      } else if (id) {
        query = {
          _id: new ObjectId(id),
        };
      }
      const result = await borrowedInfo.find(query).toArray();
      res.send(result);
    });

    app.delete("/borrowedInfo", async (req, res) => {
        const id = req.query.id;
      
        try {
          const result = await borrowedInfo.deleteOne({ _id: new ObjectId(id) });
      
          if (result.deletedCount === 1) {
            res.status(200).send({ message: "Book deleted successfully" });
          } else {
            res.status(404).send({ message: "Book not found" });
          }
        } catch (error) {
          console.error("Error deleting book:", error);
          res.status(500).send({ message: "Internal server error" });
        }
      });

    app.post("/borrowedInfo", async (req, res) => {
      const body = req.body;
      const { email, bookID } = body;
      const existingBorrowedInfo = await borrowedInfo.findOne({ email, bookID });
      if (existingBorrowedInfo) {
        return res.send({ message: "You have already borrowed this book" });
      }
      const result = await borrowedInfo.insertOne(body);
      res.send(result);
    });

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
  }
}

app.listen(port, () => {
  console.log(port, "running");
});

run().catch(console.dir);
