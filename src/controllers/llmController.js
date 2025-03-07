const axios = require("axios");

const getLLMResponse = async (prompt, creatorNames = []) => {
  try {
    // Log the input prompt for debugging
    console.log("Input Prompt:", prompt);
    console.log("Creator Names:", creatorNames);

    // Validate that the prompt contains actual data
    if (!prompt.includes('[') || !prompt.includes(']')) {
      throw new Error("Prompt must contain a JSON array of data");
    }

    let data = JSON.stringify({
      "model": process.env.LLM_MODEL,
      "messages": [
        {
          "role": "system",
          "content": `You are a precise attention distribution system. You must only return valid JSON arrays containing the exact creator names provided: ${creatorNames.join(', ')}. Do not make up usernames or return placeholder data. Each username in the response must match one of these exact names.`
        },
        {
          "role": "user",
          "content": prompt
        }
      ],
      "temperature": 0.1, // Lower temperature for more consistent outputs
      "max_tokens": 1000
    });

    const response = await axios.post(process.env.LLM_URI, data, {
      headers: { 
        'Authorization': process.env.LLM_AUTH_TOKEN, 
        'Content-Type': 'application/json'
      },
      maxBodyLength: Infinity
    });

    // Log the full response for debugging
    console.log("Full LLM Response:", JSON.stringify(response.data, null, 2));

    // Check if we have the expected data structure
    if (!response.data || !response.data.choices || !response.data.choices[0] || !response.data.choices[0].message) {
      throw new Error("Invalid response structure from LLM");
    }

    const content = response.data.choices[0].message.content;
    console.log("LLM Content:", content);

    // Parse the content as JSON
    let parsedData;
    try {
      // Clean the content string to remove any markdown formatting
      const cleanContent = content.replace(/```json\n?|\n?```/g, '').trim();
      parsedData = JSON.parse(cleanContent);
      
      // Validate the parsed data structure
      if (!Array.isArray(parsedData)) {
        throw new Error("Response must be an array");
      }

      // Validate each item in the array
      parsedData.forEach((item, index) => {
        if (!item.username || typeof item.username !== 'string') {
          throw new Error(`Invalid username at index ${index}`);
        }
        if (typeof item.attention !== 'number') {
          throw new Error(`Invalid attention value at index ${index}`);
        }
        // Validate that the username is in the allowed list
        if (!creatorNames.includes(item.username)) {
          throw new Error(`Invalid username "${item.username}" at index ${index}. Must be one of: ${creatorNames.join(', ')}`);
        }
      });

    } catch (parseError) {
      console.error("Error parsing LLM response:", parseError);
      throw new Error("Failed to parse LLM response as valid JSON");
    }

    return {
      data: parsedData,
      requestHash: response.data.requestHash || null,
      responseHash: response.data.responseHash || null
    };

  } catch (error) {
    console.error("Error in getLLMResponse:", error);
    if (error.response) {
      console.error("Error response:", error.response.data);
      throw new Error(`LLM API Error: ${error.response.data.detail || error.message}`);
    }
    throw error;
  }
};

module.exports = { getLLMResponse };
