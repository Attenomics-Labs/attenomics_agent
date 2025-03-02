// testWeeklyDistribution.js
const axios = require('axios');

const testWeeklyDistributionForAll = async () => {
  try {
    const payload = {
      weekStart: "2025-02-17",
      agentAddress: "0xAgentAddressExample",
      scheme: "MPC"
    };

    const response = await axios.post('http://localhost:3000/weekly-distribution/all', payload, {
      headers: { "Content-Type": "application/json" }
    });
    console.log("Weekly Distribution for all creators:");
    console.log(JSON.stringify(response.data, null, 2));
    
    // You may add further assertions to verify calculations here.
  } catch (error) {
    console.error("Error testing weekly distribution for all:", error.response ? error.response.data : error.message);
  }
};

testWeeklyDistributionForAll();
