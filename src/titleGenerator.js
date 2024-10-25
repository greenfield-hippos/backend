require('dotenv').config();

async function generateConversationTitle(firstUserMessage, firstAssistantReply) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;

    const prompt = `Based on the following conversation, generate a concise and descriptive title that summarizes the main topic.

User: ${firstUserMessage}
Assistant: ${firstAssistantReply}

Title:`;

    const response = await fetch('https://api.openai.com/v1/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'text-davinci-003', // Using a more suitable model for title generation
        prompt: prompt,
        max_tokens: 15,
        temperature: 0.7,
        n: 1,
        stop: ['\n'],
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Error response from OpenAI:', errorData);
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const title = data.choices[0].text.trim().replace(/^["']|["']$/g, ''); // Remove any surrounding quotes
    return title;
  } catch (error) {
    console.error('Error generating conversation title:', error.message);
    throw error;
  }
}

module.exports = generateConversationTitle;