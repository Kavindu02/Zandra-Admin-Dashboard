const { GoogleGenAI } = require('@google/genai');

exports.parseTicket = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) {
      return res.status(400).json({ error: 'No text provided' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'YOUR_GEMINI_API_KEY_HERE') {
      return res.status(500).json({ error: 'Gemini API key is not configured on the backend.' });
    }

    const ai = new GoogleGenAI({ apiKey });

    const prompt = `You are a high-fidelity data-extraction engine specializing purely in Amadeus/GDS E-Tickets.
I will provide the raw text of an uploaded ticket.

CRITICAL RULES TO FOLLOW BLINDLY:
1. "passenger": Retrieve ONLY the actual passenger's full name. Look for patterns like "SURNAME/FIRST LAST MR". NEVER extract the company header, "ZANDRA TRAVELERS", "Thank you", or any greeting text. NEVER!
2. "from" and "to": These MUST be STRICTLY 3-letter IATA airport codes (like 'CMB', 'KUL', 'SIN', 'NRT'). Do not include anything else!
3. "flightNo": MUST contain the airline code and flight number (e.g. 'MH 178'). Do NOT ever output a standalone year like '2026' as a flight number!
4. "duration": MUST be exactly in format 'XX hrs YY mins'. 
5. "issuedDate", "departureDate", "arrivalDate": MUST be STRICTLY converted to 'YYYY-MM-DD' (e.g. '2026-04-05'). Do not include time inside date fields.
6. "departureTime", "arrivalTime": MUST be STRICTLY 'HH:mm' (e.g. '06:20').
7. "pnr" or Booking Ref: Is an exact 5 or 6 alphanumeric character string (e.g. '8XC2JL'). Do not include slashes.
8. NEVER hallucinate. If you are missing a piece of data within a segment, return an empty string "" rather than guessing a wrong text block.

Your JSON output MUST exactly match this format without any other explanatory text:
{
  "passenger": "string",
  "pnr": "string",
  "ticketNo": "string", 
  "issuedDate": "YYYY-MM-DD",
  "segments": [
    {
      "airline": "string",
      "equipment": "string",
      "flightNo": "string",
      "from": "string",
      "to": "string",
      "departureDate": "YYYY-MM-DD",
      "departureTime": "HH:mm",
      "arrivalDate": "YYYY-MM-DD",
      "arrivalTime": "HH:mm",
      "departureTerminal": "string",
      "arrivalTerminal": "string",
      "airlineRef": "string",
      "status": "string",
      "baggage": "string",
      "fareBasis": "string",
      "duration": "string",
      "class": "string"
    }
  ]
}

RAW TEXT TO PARSE:
${text}
`;

    // Attempt generation
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    const outputText = response.text;
    
    // Safety parsing block removing backticks if they appear
    const cleanJSON = outputText.replace(/^```json/mi, '').replace(/^```/mi, '').trim();

    try {
      const parsedData = JSON.parse(cleanJSON);
      return res.json(parsedData);
    } catch (parseError) {
      console.error("AI returned malformed JSON: ", cleanJSON);
      return res.status(500).json({ error: 'AI did not return valid JSON' });
    }

  } catch (error) {
    console.error('Gemini extraction error:', error);
    res.status(500).json({ error: error.message || 'Error occurred during AI parsing' });
  }
};
