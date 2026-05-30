const express = require('express')
const cors = require('cors')
const dotenv = require('dotenv')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

dotenv.config()
const uri = process.env.MONGODB_URI;

const app = express()
app.use(cors())
app.use(express.json())
const PORT = process.env.PORT || 5000;

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
        const bookingCollection = db.collection('booking')

        app.post('/rooms', async (req, res) => {
            const rooms = req.body;
            const result = await roomCollection.insertOne(rooms);
            res.json(result);
        });

        app.get('/rooms/featured', async (req, res) => {
            const result = await roomCollection.find().sort({ _id: -1 }).limit(6).toArray()
            res.send(result)
        });

        app.get('/rooms', async (req, res) => {
            const result = await roomCollection.find().toArray()
            res.send(result)
        });

        app.get('/rooms/:id', async (req, res) => {
            const { id } = req.params;
            const result = await roomCollection.findOne({ _id: new ObjectId(id) })
            res.send(result)
        });
        app.patch('/rooms/:id', async(req,res)=>{
            const {id} = req.params
            const UpdatedRoom = req.body
            console.log(UpdatedRoom);
            const result = await roomCollection.updateOne(
                {_id: new ObjectId(id)},
                {$set: UpdatedRoom}
            )
            res.send(result)
        })

        app.get('/booking', async (req, res) => {
            const { roomId, date } = req.query;
            let query = {};
            if (roomId) query.roomId = roomId;
            if (date) query.date = date;
            const bookings = await bookingCollection.find(query).toArray();
            res.send(bookings);
        });
        app.delete('/rooms/:id', async(req,res)=>{
          const {id} = req.params;
          const result = await roomCollection.deleteOne({_id: new ObjectId(id)})
          res.json(result);  
        })


        app.post('/booking', async (req, res) => {
            try {
                const bookingRoom = req.body;
                const { roomId, date, startTime, endTime } = bookingRoom;

                console.log("Received booking request:", { roomId, date, startTime, endTime });


                const existingBooking = await bookingCollection.findOne({
                    roomId: roomId,
                    date: date,
                    startTime: { $lt: endTime },
                    endTime: { $gt: startTime }
                });

                if (existingBooking) {

                    return res.status(409).json({
                        success: false,
                        message: `Sorry! This room is already booked from ${existingBooking.startTime} to ${existingBooking.endTime} on ${date}`
                    });
                }

                const result = await bookingCollection.insertOne({
                    ...bookingRoom,
                    bookedAt: new Date(),
                    status: "confirmed"
                });

                console.log("Booking saved:", result.insertedId);

                res.status(201).json({
                    success: true,
                    message: "Booking successful!",
                    bookingId: result.insertedId
                });

            } catch (error) {

                res.status(500).json({
                    success: false,
                    message: "Server error: " + error.message
                });
            }
        });

        app.get('/booking/check', async (req, res) => {
            try {
                const { roomId, date, startTime, endTime } = req.query;

                const existingBooking = await bookingCollection.findOne({
                    roomId: roomId,
                    date: date,
                    startTime: { $lt: endTime },
                    endTime: { $gt: startTime }
                });


                if (existingBooking) {
                    res.json({
                        available: false,
                        message: `Already booked from ${existingBooking.startTime} to ${existingBooking.endTime}`
                    });
                } else {
                    res.json({
                        available: true,
                        message: "Time slot is available"
                    });
                }
            } catch (error) {
                res.status(500).json({
                    available: false,
                    message: "Error checking availability"
                });
            }
        });
        app.get('/booking/:userId', async (req, res) => {
            const { userId } = req.params;
            const result = await bookingCollection.find({ userId: userId }).toArray();
            res.send(result);

        })
        app.patch('/booking/:bookingId', async (req, res) => {
            try {
                const { bookingId } = req.params;
                const result = await bookingCollection.updateOne(
                    { _id: new ObjectId(bookingId) },
                    { $set: { status: "canceled" } }
                );
                res.send(result);
            } catch (error) {
                res.status(500).send({ message: error.message });
            }
        });

        await client.db("admin").command({ ping: 1 });
        console.log("Successfully connected to MongoDB!");

    } catch (error) {
        console.error("Database connection error:", error);
    }

}


run().catch(console.dir);

app.get('/', (req, res) => {
    res.send('Server is running good')
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});