import mammoth from 'mammoth';

export const parseTicketFile = async (fileBuffer) => {
  try {
    const { value: text } = await mammoth.extractRawText({ arrayBuffer: fileBuffer });
    
    // Attempt parsing via our secure backend node attached to Gemini API
    const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/gemini/parse-ticket`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
    });

    if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to parse document via AI');
    }

    const parsedData = await response.json();
    return parsedData;

  } catch(e) {
    console.error("Error parsing Word document", e);
    throw new Error("Could not parse E-Ticket document properly. Please verify it's a standard .docx format.");
  }
};
