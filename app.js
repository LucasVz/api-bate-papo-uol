import express from "express";
import cors from 'cors';
import { MongoClient, ObjectId} from 'mongodb';
import dotenv from 'dotenv'
import dayjs from "dayjs";

dotenv.config();

const mongoClient = new MongoClient(process.env.MONGO_URI);
let db;
mongoClient.connect(() => {
  db = mongoClient.db("library");
});

const app = express();
app.use(express.json());
app.use(cors());

let name;

app.post('/participants', async (req,res) =>{
    try{
        const participant = req.body;
        const time = dayjs().format('hh:mm:ss');
        const message = {from: req.body.name, to: 'Todos', text: 'entra na sala...', type: 'status', time: time}
        await db.collection('participants').insertOne(participant);
        await db.collection('messages').insertOne(message);
        res.status(201).send("OK");
    }
    catch (error) {
        res.sendStatus(500)
    }
});

app.get('/participants', async (req,res) =>{
    try{
        const products = await db.collection('participants').find().toArray();
        res.status(201).send(products);
    }
    catch (error) {
        res.sendStatus(500)
    }
});

app.get('/messages', async (req,res) =>{
    try{
        const products = await db.collection('messages').find().toArray();
        res.status(201).send(products);
    }
    catch (error) {
        res.sendStatus(500)
    }
});

app.listen(5000, () => {
    console.log("Rodando em http://localhost:5000")
});