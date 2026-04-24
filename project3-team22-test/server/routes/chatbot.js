const express = require('express');
const router = express.Router();
const Groq = require('groq-sdk');
const pool = require('../db');

// POST /api/chat
router.post('/', async (req, res) => {
  try {
    const { message, history } = req.body;

    if (!process.env.GROQ_API_KEY) {
      return res.status(500).json({ error: 'GROQ_API_KEY is missing from the environment.' });
    }

    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

    // Use the live database menu to define the AI's personality
    const menuRes = await pool.query('SELECT item_name, price, category FROM menu');
    const menuText = menuRes.rows.map(r => `- ${r.item_name} ($${r.price}) [${r.category}]`).join('\n');

    const systemPrompt = `You are a helpful, extremely concise, and friendly AI Assistant working inside a real ordering kiosk at "Dragon Boba". 
Your job is to recommend items and politely answer questions. Always be extremely brief (1-3 sentences max).

Here is the exact live menu from the PostgreSQL database:
${menuText}

Never hallucinate items not on this list. Only answer questions related to boba, our location, or our menu. If they ask a wild question, gently pivot back to bubble tea.`;

    // Map conversation history to OpenAI-compatible format
    const formattedHistory = (history || [])
      .filter(msg => msg.role === 'user' || msg.role === 'assistant')
      .map(msg => ({
        role: msg.role,
        content: msg.content,
      }));

    const messages = [
      { role: 'system', content: systemPrompt },
      ...formattedHistory,
      { role: 'user', content: message },
    ];

    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages,
      max_tokens: 256,
      temperature: 0.7,
    });

    const reply = completion.choices[0]?.message?.content || "Sorry, I didn't catch that!";
    res.json({ reply });

  } catch (error) {
    console.error('[Groq Error]:', error);
    res.status(500).json({ error: 'Failed to communicate with the Dragon AI Assistant.' });
  }
});

module.exports = router;
