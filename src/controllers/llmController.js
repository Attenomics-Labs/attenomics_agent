import axios from "axios";

export const getLLMResponse = async (prompt) => {
    let data = JSON.stringify({
        "model": process.env.LLM_MODEL,
        "messages": [
            {
                "role": "user",
                "content": prompt
            }
        ]
    });

    let config = {
        method: 'post',
        maxBodyLength: Infinity,
        url: process.env.LLM_URI,
        headers: { 
          'Authorization': process.env.LLM_AUTH_TOKEN, 
          'Content-Type': 'application/json'
        },
        data : data
      };



    const aiResponse = await axios.request(config);
    console.log(aiResponse.data);
    return {"data": JSON.parse(aiResponse.data['choices'][0]['message']['content']), "requestHash": aiResponse.data['requestHash'], "responseHash": aiResponse.data['responseHash']};
}