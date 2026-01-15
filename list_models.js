
const { GoogleGenAI } = require("@google/genai");
require('dotenv').config();

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

async function listModels() {
  try {
    console.log("Fetching available models...");
    const response = await ai.models.list();
    
    console.log("\n--- Available Models ---");
    // The response structure might vary based on SDK version, 
    // but usually it's an iterable or has a 'models' property.
    // We'll try to log the raw object first if iteration fails, 
    // but the SDK usually returns a list or async iterable.
    
    // Check if response is iterable directly (common in new SDKs)
    for await (const model of response) {
      console.log(`- ${model.name} (Supported methods: ${model.supportedGenerationMethods})`);
    }
  } catch (error) {
    console.error("Error listing models:", error);
  }
}

listModels();
