const express = require('express');
const router = express.Router();

// POST /api/translate
// Body: { texts: string[], targetLang: string }
// Returns: { translations: string[] }
router.post('/', async (req, res) => {
  const { texts, targetLang } = req.body;

  if (!texts || !Array.isArray(texts) || texts.length === 0) {
    return res.status(400).json({ error: 'texts array is required' });
  }
  if (!targetLang) {
    return res.status(400).json({ error: 'targetLang is required' });
  }
  if (targetLang === 'en') {
    return res.json({ translations: texts });
  }

  const apiKey = process.env.GOOGLE_TRANSLATE_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Google Translate API key not configured' });
  }

  try {
    const url = `https://translation.googleapis.com/language/translate/v2?key=${apiKey}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        q: texts,
        source: 'en',
        target: targetLang,
        format: 'text',
      }),
    });

    const data = await response.json();

    if (data.error) {
      console.error('Google Translate API error:', data.error.message);
      return res.status(502).json({ error: data.error.message });
    }

    const translations = data.data.translations.map(t => t.translatedText);
    res.json({ translations });
  } catch (err) {
    console.error('Translation proxy error:', err.message);
    res.status(500).json({ error: 'Translation service unavailable' });
  }
});

module.exports = router;
