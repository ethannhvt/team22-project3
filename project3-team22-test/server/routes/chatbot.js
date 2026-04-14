const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const pool = require('../db');

// POST /api/chat
router.post('/', async (req, res) => {
  try {
    const { message, history } = req.body;

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: 'GEMINI_API_KEY is missing from the environment.' });
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

    // Use the live database menu to define the AI's personality
    const menuRes = await pool.query('SELECT item_name, price, category FROM menu');
    const menuText = menuRes.rows.map(r => `- ${r.item_name} ($${r.price}) [${r.category}]`).join('\n');

    const systemPrompt = `You are a helpful, extremely concise, and friendly AI Assistant working inside a real ordering kiosk at "Dragon Boba". 
Your job is to recommend items and politely answer questions. Always be extremely brief (1-3 sentences max).

Here is the exact live menu from the PostgreSQL database:
${menuText}

Never hallucinate items not on this list. Only answer questions related to boba, our location, or our menu. If they ask a wild question, gently pivot back to bubble tea.`;

    const model = genAI.getGenerativeModel({
      model: "gemini-3-flash-preview",
      systemInstruction: systemPrompt
    });

    // Map conversation array to Gemini format, filtering out any leading model messages
    // (Gemini requires history to always start with 'user')
    let formattedHistory = (history || [])
      .filter(msg => msg.role === 'user' || msg.role === 'assistant')
      .map(msg => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }]
      }));

    // Drop any leading 'model' messages — Gemini will reject them
    while (formattedHistory.length > 0 && formattedHistory[0].role === 'model') {
      formattedHistory.shift();
    }

    // Initialize chat session with history
    const chat = model.startChat({
      history: formattedHistory
    });

    const result = await chat.sendMessage(message);

    res.json({ reply: result.response.text() });
  } catch (error) {
    console.error('[Gemini Error]:', error);
    res.status(500).json({ error: 'Failed to communicate with the Dragon AI Assistant. Verify the API Key.' });
  }
});

module.exports = router;
