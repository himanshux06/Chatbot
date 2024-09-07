const express = require("express");
const cors = require("cors");
const OpenAI = require("openai");
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const port = process.env.PORT || 3000;

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
if (!OPENAI_API_KEY) {
    throw new Error("Missing OPENAI_API_KEY environment variable.");
}

const ASSISTANT_ID = process.env.ASSISTANT_ID;
if (!ASSISTANT_ID) {
    throw new Error("Missing ASSISTANT_ID environment variable.");
}

const openai = new OpenAI({
    apiKey: OPENAI_API_KEY,
});

app.get('/', (req, res) => {
    res.send('Hello World!');
});

app.post(`/chat/new`, async (req, res) => {
    try {
        const thread = await openai.beta.threads.create();
        res.json({
            threadId: thread.id,
        });
    } catch (error) {
        console.error("Error creating thread:", error);
        res.status(500).json({ error: "Failed to create thread" });
    }
});

app.post(`/chat/send`, async (req, res) => {
    const { threadId, text } = req.body;

    if (!threadId || !text) {
        return res.status(400).json({ error: "Missing required fields: threadId and text" });
    }

    try {
        await openai.beta.threads.messages.create(threadId, {
            role: "user",
            content: text,
        });

        const run = await openai.beta.threads.runs.create(threadId, {
            assistant_id: ASSISTANT_ID,
        });

        res.json({
            runId: run.id,
        });
    } catch (error) {
        console.error("Error sending message:", error);
        res.status(500).json({ error: "Failed to send message" });
    }
});

app.post(`/chat/list`, async (req, res) => {
    const { threadId, runId } = req.body;

    if (!threadId) {
        return res.status(400).json({ error: "Missing required field: threadId" });
    }

    try {
        const messages = await openai.beta.threads.messages.list(threadId);

        let status = undefined;
        if (runId) {
            const run = await openai.beta.threads.runs.retrieve(threadId, runId);
            status = run.status;
        }

        res.json({
            messages: messages.data,
            status,
        });
    } catch (error) {
        console.error("Error listing messages:", error);
        res.status(500).json({ error: "Failed to list messages" });
    }
});

app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});
