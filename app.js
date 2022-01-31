import express from "express";
import cors from 'cors';
import { MongoClient, ObjectId } from 'mongodb';
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

const messageSchema = joi.object({
    to: joi.string().required(),
    text: joi.string().required(),
    type: joi.string().valid('message', 'private_message').required()
});

let timeInMs = Date.now();
let time = dayjs().format('hh:mm:ss');
setInterval(removeInactiveUser, 15000);
app.post('/participants', async (req, res) => {
    const participant = req.body;
    const validation = participantSchema.validate(participant, { abortEarly: true });
    const message = { from: req.body.name, to: 'Todos', text: 'entra na sala...', type: 'status', time: time }
    const participantFormat = { name: participant.name, lastStatus: timeInMs }
    let findParticipant = await db.collection('participants').find(participant).toArray()

    try {
        if (validation.error) {
            res.sendStatus(422);
            return;
        }


        if (findParticipant.length > 0) {
            res.sendStatus(409);
            return;
        }

        await db.collection('participants').insertOne(participantFormat);
        await db.collection('messages').insertOne(message);
        res.status(201).send("OK");
    }
    catch (error) {
        console.log(error);
        res.sendStatus(500);
    }
});

app.get('/participants', async (req, res) => {
    try {
        const products = await db.collection('participants').find().toArray();
        res.status(201).send(products);
    }
    catch (error) {
        res.sendStatus(500)
    }
});

app.post('/messages', async (req, res) => {
    const message = req.body;
    const user = req.headers.user;
    const validation = messageSchema.validate(message, { abortEarly: false });
    const messageFormat = { from: user, to: message.to, text: message.text, type: message.type, time: time }
    const findUser = await db.collection('participants').findOne({ name: user })

    try {
        if (validation.error || !findUser) {
            res.sendStatus(422);
            return;
        }

        await db.collection('messages').insertOne(messageFormat);
        res.status(201).send("OK");
    }
    catch (error) {
        console.log(error);
        res.sendStatus(500);
    }
});


app.get('/messages', async (req, res) => {
    const limit = parseInt(req.query.limit);
    const user = req.headers.user;
    const messages = await db.collection('messages').find().toArray();
    const sendMessages = messages.filter(msgs => (msgs.from === user || msgs.to === user || msgs.type !== 'private_message'))

    try {
        if (!limit) {
            res.status(201).send(sendMessages)
        }
        else {
            res.status(201).send(sendMessages.slice(-limit))
        }
    }
    catch (error) {
        res.sendStatus(500)
    }
});


app.post('/status', async (req, res) => {
    const user = req.headers.user;
    const findUser = await db.collection('participants').findOne({ name: user })

    try {
        if (!findUser) {
            res.sendStatus(404);
            return;
        }

        await db.collection('participants').updateOne(
            {
                _id: findUser._id,
            },
            {
                $set: { ...findUser, lastStatus: timeInMs }
            });
        res.sendStatus(200);
    }
    catch (error) {
        console.log(error);
        res.sendStatus(500);
    }
});

async function removeInactiveUser(){
    const participants = await db.collection('participants').find({}).toArray();
    for(let i = 0 ; i < participants.length; i++){
        if(timeInMs - participants[i].lastStatus >10000){
            let message = { from: participants[i].name, to: 'Todos', text: 'sai da sala...', type: 'status', time: time }
            await db.collection('messages').insertOne(message);
            await db.collection('participants').deleteOne({ _id: participants[i]._id });
        }
    }
}

app.listen(5000, () => {
    console.log("Rodando em http://localhost:5000")
});