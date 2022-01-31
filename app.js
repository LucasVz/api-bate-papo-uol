import express from "express";
import cors from 'cors';
import { MongoClient, ObjectId} from 'mongodb';
import dotenv from 'dotenv'
import dayjs from "dayjs";
import joi from 'joi'

dotenv.config();

const mongoClient = new MongoClient(process.env.MONGO_URI);
let db;
mongoClient.connect(() => {
  db = mongoClient.db("library");
});

const app = express();
app.use(express.json());
app.use(cors());

const participantSchema = joi.object({
    name: joi.string().required()
});

app.post('/participants', async (req,res) =>{
    const participant = req.body;
    const time = dayjs().format('hh:mm:ss');
    const validation = participantSchema.validate(participant, { abortEarly: true });
    let timeInMs = Date.now();
    const message = {from: req.body.name, to: 'Todos', text: 'entra na sala...', type: 'status', time: time}
    const participantFormat =  {name: participant.name, lastStatus: timeInMs}
    if (validation.error) {
        res.sendStatus(422);
        return;
    }

    let findParticipant = await db.collection('participants').find(participant).toArray()

    console.log(findParticipant);
    if (findParticipant.length > 0){
        res.sendStatus(409);
        return;
    }

    try{
        await db.collection('participants').insertOne(participantFormat);
        await db.collection('messages').insertOne(message);
        res.status(201).send("OK");
    }
    catch (error) {
        console.log(error);
        res.sendStatus(500);
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

app.post('/messages', async (req,res) =>{
    const message = req.body;
    const user = req.headers.user;
    const time = dayjs().format('hh:mm:ss');
    //const validation = participantSchema.validate(participant, { abortEarly: true });
    let timeInMs = Date.now();
    const messageFormat = {from: user, to: message.to, text: message.text, type: message.type, time: time}

    try{
        await db.collection('messages').insertOne(messageFormat);
        res.status(201).send("OK");
    }
    catch (error) {
        console.log(error);
        res.sendStatus(500);
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