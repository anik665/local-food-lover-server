const express = require("express");
const mongoose = require("mongoose");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const app = express();
const cors = require("cors");
const dotenv = require("dotenv");
dotenv.config();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

//mongodb
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.p8lzuaz.mongodb.net/?appName=Cluster0`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});
async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const database = client.db("localdb");
    const products = database.collection("products");
    const favorites = database.collection("favorites");

    //products api

    app.post("/products", async (req, res) => {
      const product = req.body;
      const result = await products.insertOne(product);
      res.send(result);
    });
    app.get("/products", async (req, res) => {
      const result = await products.find().toArray();
      res.send(result);
    });

    app.get("/latest-reviews", async (req, res) => {
      const reviews = products.find().sort({ rating: -1 }).limit(6);
      const result = await reviews.toArray();
      res.send(result);
    });

    // Search api
    app.get("/reviews", async (req, res) => {
      const search = req.query.search || "";
      let query = {};
      if (search) {
        query = { foodName: { $regex: search, $options: "i" } };
      }
      const result = await products.find(query).toArray();
      res.send(result);
    });

    //favorites api
    app.post("/favorites", async (req, res) => {
      const favorite = req.body;
      const result = await favorites.insertOne(favorite);
      res.send(result);
    });

    app.get("/favorites", async (req, res) => {
      const email = req.query.email;

      const favoriteItems = await favorites.find({ email: email }).toArray();
      const ids = favoriteItems.map((item) => new ObjectId(item.productId));

      const result = await products.find({ _id: { $in: ids } }).toArray();

      // প্রতিটা product এর সাথে favorites._id যোগ করুন
      const finalResult = result.map((product) => {
        const favItem = favoriteItems.find(
          (fav) => fav.productId === product._id.toString(),
        );
        return {
          ...product,
          favoriteId: favItem._id.toString(), // এইটা নতুন যোগ হলো
        };
      });

      res.send(finalResult);
    });

    app.delete("/favorites/:id", async (req, res) => {
      try {
        const productId = req.params.id;
        const email = req.query.email; // email ও পাঠাতে হবে

        const query = { _id: new ObjectId(productId), email: email };
        console.log(query);
        const result = await favorites.deleteOne(query);

        console.log("DELETE RESULT:", result);
        res.send(result);
      } catch (error) {
        res
          .status(500)
          .send({ message: "failed to delete favorite", error: error.message });
      }
    });

    //my-reviews api
    app.get("/my-reviews", async (req, res) => {
      const email = req.query.email;
      console.log(email, "fontent email");
      const query = { userEmail: email };
      const result = await products.find(query).toArray();
      console.log(result, "result is this");
      res.send(result);
    });

    app.delete("/products/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await products.deleteOne(query);
      res.send(result);
    });

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!",
    );
  } finally {
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Server is running");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}`);
});
