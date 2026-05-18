const express = require('express')
const cors = require('cors')
const dotenv = require('dotenv')
const { MongoClient, ServerApiVersion } = require('mongodb');

dotenv.config()
const uri =process.env.MONGODB_URI;

app.use(cors())
const app = express()
const PORT = process.env.PORT;


const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    await client.connect();

    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    await client.close();
  }
}
run().catch(console.dir)
app.get('/', (req,res)=>{
    res.send('server is running good')
})
app.listen(PORT, ()=>{
    console.log(`server running on port${PORT}`);
})
