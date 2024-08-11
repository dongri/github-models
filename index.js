import ModelClient from "@azure-rest/ai-inference";
import { AzureKeyCredential } from "@azure/core-auth";
import readline from "readline";

// To authenticate with the model you will need to generate a personal access token (PAT) in your GitHub settings. 
// Create your PAT token by following instructions here: https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens
const token = process.env["GITHUB_TOKEN"];

const client = new ModelClient(
    "https://models.inference.ai.azure.com",
    new AzureKeyCredential(token)
);

// Initialize readline interface for reading user input from the terminal
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// Array to store conversation history
let conversationHistory = [];

async function getResponse(userInput) {
    // Add the user's message to the conversation history
    conversationHistory.push({ role: "user", content: userInput });

    const response = await client.path("/chat/completions").post({
        body: {
            messages: conversationHistory, // Send the entire conversation history
            model: "Meta-Llama-3-8B-Instruct",
            temperature: 0.8,
            max_tokens: 128,
            top_p: 0.1
        }
    });

    if (response.status !== "200") {
        throw response.body.error;
    }

    const aiMessage = response.body.choices[0].message.content;
    // Add the AI's response to the conversation history
    conversationHistory.push({ role: "assistant", content: aiMessage });

    return aiMessage;
}

function promptUser() {
    rl.question("User > ", async (input) => {
        try {
            const aiResponse = await getResponse(input);
            console.log("AI > " + aiResponse);
        } catch (err) {
            console.error("The sample encountered an error:", err);
        }
        promptUser(); // Loop back to prompt the user again
    });
}

promptUser(); // Start the input loop
