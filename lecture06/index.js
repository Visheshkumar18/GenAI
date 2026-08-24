import { FunctionResponse, GoogleGenAI, Type } from "@google/genai";
import { exec } from "child_process";
import util from 'util'
import os from 'os';
import readlineSync from 'readline-sync'
import dotenv from 'dotenv'
dotenv.config();
// this tell which os you are currently used 
const platform = os.platform();
const execute = util.promisify(exec);
const ai = new GoogleGenAI({});
// tool
async function executeCommand({ command }) {
    try {
        const { stdout, stderr } = await execute(command);
        if (stderr) {
            return `Error: ${stderr}`
        }
        return `success: ${stdout}`
    }
    catch (err) {
        return `Error: ${err}`;
    }
}
const commandExeInfo = {
    name: "executeCommand",
    description: "it take shell/terminal command and execute it that will create, write, update,delete file or folder",
    parameters: {
        type: Type.OBJECT,
        properties: {
            command: {
                type: Type.STRING,
                description:"it is the command that will execute e.g. mkdir"
            }
        },
        required:['command']

    }
}
const History = [];
async function RunAgent() {
    while (true) {
        let response = await ai.models.generateContent({
          model: "gemini-3.5-flash-lite",
          contents: History,
          config: {
            systemInstruction: `
            You are a coding agent that works directly on the user's computer.

            Follow this workflow:

            1. First create the main project folder.
            2. Then create the required files inside that folder.
            3. Create files ONE AT A TIME, in the correct order.
            4. After each command, inspect the result before continuing.
            5. For a simple DSA problem, create the appropriate source file and write the solution.
            6. For a website, create the required files in sequence (HTML, CSS, JS, etc.) based on the requirements.
            7. Use the operating system's ${platform} and give appropriate terminal commands.
            8. Never claim a file or folder was created unless the tool result confirms it.
            9. If a command fails, fix the problem and continue.
            10. Stop only when the requested project is complete.`,

            tools: [{ functionDeclarations: [commandExeInfo] }],
          },
        });
        if (response.functionCalls && response.functionCalls.length > 0) {
          const functionCall = response.functionCalls[0];
          const { name, args } = functionCall;
          History.push(response.candidates[0].content);
          const result = await executeCommand(args);
          History.push({
            role: "user",
            parts: [{ functionResponse: { name, response:{result:result} } }],
          });
        } else {
          console.log(response.text);
          History.push({
            role: "model",
            parts: [{ text: response.text }],
          });
            break;
        }
   }
}
while (true) {
    const question = readlineSync.question("ASK ME ANYTHING: ");
    if (question == 'exit') break;
    History.push({
        role: 'user',
        parts:[{text:question}]
    })
    await RunAgent();

}