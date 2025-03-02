// testWeeklyDistribution.js
const axios = require('axios');

const testWeeklyDistribution = async () => {
  try {
    const payload = {
      creatorName: "JohnDoe",
      tokenContract: "0xABCDEF1234567890ABCDEF1234567890ABCDEF12",
      distributionContract: "0x1234567890ABCDEF1234567890ABCDEF12345678",
      agentAddress: "0xAgentAddressExample",
      scheme: "MPC",
      weekStart: "2025-02-17"
    };

    const response = await axios.post('http://localhost:3000/weekly-distribution', payload, {
      headers: {
        "Content-Type": "application/json"
      }
    });
    console.log("Weekly Distribution Response:", JSON.stringify(response.data, null, 2));
} catch (error) {
    console.error("Error testing weekly distribution:", error.response ? error.response.data : error.message);
  }
};

testWeeklyDistribution();
