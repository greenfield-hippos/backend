require('dotenv').config();

async function generateConversationTitle(firstUserMessage, firstAssistantReply) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;

    const prompt = `Based on the following conversation, generate a concise and descriptive title that summarizes the main topic.
      User: ${firstUserMessage}
      Assistant: ${firstAssistantReply}
      Title:`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo', // Using a more suitable model for title generation
        max_tokens: 15,
        temperature: 0.7,
        n: 1,
        stop: ['\n'],
        messages: [{role: 'assistant', content: prompt}]
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Error response from OpenAI:', errorData);
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log(data.choices[0].message)
    console.log(data.choices[0].message.content)
    const title = data.choices[0].message.content.trim().replace(/^["']|["']$/g, ''); // Remove any surrounding quotes
    return title;
  } catch (error) {
    console.error('Error generating conversation title:', error.message);
    throw error;
  }
}

module.exports = generateConversationTitle;