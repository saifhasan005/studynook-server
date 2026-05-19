const express = require('express')
const cors = require('cors')
const dotenv = require('dotenv')
const { MongoClient, ServerApiVersion } = require('mongodb');

dotenv.config()
const uri = process.env.MONGODB_URI;

const app = express()
app.use(cors())
app.use(express.json())
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
        const db = client.db('studynook')
        const roomCollection = db.collection('studyNookCollection')

        app.post('/rooms', async (req, res) => {
            const rooms = req.body;
            console.log('Room Data', rooms);
            const result = await roomCollection.insertOne(rooms);


            res.json(result);
        });
        app.get('/rooms/featured', async (req, res) => {
            const result = await roomCollection.find().sort({ _id: -1 }).limit(6).toArray()
            res.send(result)
        })
        app.get('/rooms', async (req, res) => {
            const result = await roomCollection.find().toArray()
            res.send(result)
        })
        const { ObjectId } = require('mongodb');
        app.get('/rooms/:id', async (req, res) => {
            const { id } = req.params;
            const result = await roomCollection.findOne({ _id: new ObjectId(id) })
            res.send(result)
        })



        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir)
app.get('/', (req, res) => {
    res.send('server is running good')
})
app.listen(PORT, () => {
    console.log(`server running on port${PORT}`);
})
