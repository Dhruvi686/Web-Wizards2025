const Groq = require('groq-sdk');

// Initialize Groq client
const groq = new Groq({
  apiKey: process.env.VITE_LLM_API_KEY
});

/**
 * Generate poll structure using AI based on user's natural language input
 * @param {string} userPrompt - The user's natural language description of the poll
 * @returns {Promise<Object>} Generated poll structure
 */
async function generatePollStructure(userPrompt) {
  try {
    const systemPrompt = `You are a helpful assistant that creates poll structures based on user requests. 
    
    Based on the user's natural language input, generate a JSON response with the following structure:
    {
      "title": "A clear, concise poll title",
      "description": "A brief description of what the poll is about",
      "options": [
        "Option 1",
        "Option 2",
        "Option 3",
        ...
      ]
    }
    
    Guidelines:
    - Generate appropriate number of options based on the context (minimum 2, maximum 10)
    - Make options clear, distinct, and relevant to the topic
    - Keep titles concise but descriptive
    - Make descriptions informative but brief
    - If the user specifies a number of options, respect that number
    - If the user's request is unclear, make reasonable assumptions and create a useful poll
    
    Return only valid JSON, no additional text or explanation.`;

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: userPrompt
        }
      ],
      model: process.env.VITE_LLM_MODEL || "llama-3.3-70b-versatile",
      temperature: 0.7,
      max_tokens: 500,
    });

    const generatedContent = chatCompletion.choices[0]?.message?.content?.trim();
    
    if (!generatedContent) {
      throw new Error('No response generated from AI service');
    }
    
    // Parse the JSON response
    const pollStructure = JSON.parse(generatedContent);
    
    // Validate the structure
    if (!pollStructure.title || !pollStructure.description || !Array.isArray(pollStructure.options)) {
      throw new Error('Invalid poll structure generated');
    }
    
    if (pollStructure.options.length < 2) {
      throw new Error('Poll must have at least 2 options');
    }
    
    if (pollStructure.options.length > 10) {
      pollStructure.options = pollStructure.options.slice(0, 10);
    }
    
    return pollStructure;
    
  } catch (error) {
    console.error('Error generating poll structure:', error);
    
    // If JSON parsing fails, try to extract content manually
    if (error instanceof SyntaxError) {
      throw new Error('Failed to parse AI response. Please try rephrasing your request.');
    }
    
    // If it's a Groq API error
    if (error.status) {
      switch (error.status) {
        case 401:
          throw new Error('Groq API key is invalid or missing');
        case 429:
          throw new Error('Groq API rate limit exceeded. Please try again later.');
        case 500:
          throw new Error('Groq service is temporarily unavailable');
        default:
          throw new Error(`Groq API error: ${error.message}`);
      }
    }
    
    throw new Error('Failed to generate poll structure. Please try again.');
  }
}

/**
 * Check if AI service is properly configured
 * @returns {boolean} True if configured, false otherwise
 */
function isConfigured() {
  return !!process.env.VITE_LLM_API_KEY && 
         process.env.VITE_LLM_PROVIDER === 'groq' &&
         !!process.env.VITE_LLM_MODEL;
}

module.exports = {
  generatePollStructure,
  isConfigured
};