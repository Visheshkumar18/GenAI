import { GoogleGenAI, Type } from '@google/genai'
import dotenv from 'dotenv'
import fs from 'fs'
import path from 'path'
dotenv.config()
const ai = new GoogleGenAI({});
/*-------tools-----*/
async function listFiles({ directory }) {
    const files = [];
    const extension = ['.js', '.jsx', '.cpp', '.ts', '.html', '.css'];
    function scan(dir) {
        // read file or folder just next level
        const items = fs.readdirSync(dir);
        for (const item of items) {
            const fullPath = path.join(dir, item);
            if (fullPath.includes('node_modules') || fullPath.includes('dist') || fullPath.includes('build')) continue;
            // it tell the given item is folder or file
            const stat = fs.statSync(fullPath);
            if (stat.isDirectory()) {
                scan(fullPath);
            }
            else if (stat.isFile()) {
                // extract the extension name like .js,.env 
                const ext = path.extname(item);
                if (extension.includes(ext)) {
                    files.push(fullPath);
                }
            }
        }
    }
    scan(directory);
    return {files}
}
async function readFile({ file_path }) {
    const content = fs.readFileSync(file_path, 'utf-8');
    console.log(`Reading file ${file_path}`);
    return { content };
}
async function writeFile({ file_path, content }) {
    fs.writeFileSync(file_path, content,'utf-8');
    console.log(`writing in file ${file_path}`);
    return {success:true}
}
/*-------------tools directory---------------*/
const listFileTools = {
    name: 'listFiles',
    description: 'Get all files in a directory',
    parameters: {
        type: Type.OBJECT,
        properties: {
            directory: {
                type: Type.STRING,
                description:'Directory path to scan'
            }
        },
        required: ['directory']
    }
}
const readFileTools = {
    name: "readFile",
    description: "it read content of file/ folder of a given path",
    parameters: {
        type: Type.OBJECT,
        properties: {
            file_path: {
                type: Type.STRING,
                description:'it is the location of a directory/folder/file'
            }
        },
        required:['file_path']
    }
}
const writeFileTools = {
  name: "writeFile",
  description: "it write in the folder/file of a given path",
  parameters: {
    type: Type.OBJECT,
    properties: {
      file_path: {
        type: Type.STRING,
        description: "it is the location of a file/folder",
      },
      content: {
        type: Type.STRING,
        description: "Content to write to the file",
      },
    },
    required: ["file_path",'content'],
  },
};
const tools = {
    'listFiles': listFiles,
    'readFile': readFile,
    'writeFile':writeFile
}

/*----------Run Agent------------*/
const History = [];
async function RunAgent(directory) {
     History.push({
       role: "user",
       parts: [{ text: directory }],
     });
  while (true) {
    let response = await ai.models.generateContent({
      model: "gemini-3.5-flash-lite",
      contents: History,
      config: {
        systemInstruction: `
            You are a Code Reviewer Agent working on the user's computer.

        Workflow:
        1. Inspect the project/files before reviewing.
        2. Read relevant files and verify their contents.
        3. Understand the intended functionality first.
        4. Check for:
        - Bugs and logic errors
        - Edge cases
        - Security issues
        - Performance problems
        - Error handling
        - Code quality
        - DSA time/space complexity when applicable
        5. Run compile/tests/lint when useful and inspect the result.
        6. Never invent errors, test results, or file contents.
        7. Do not modify code unless explicitly asked.
        8. Report only actionable issues with:
        Severity | File/Line | Problem | Fix
        9. Separate real bugs from optional suggestions.
        10. Finish with a short overall assessment.`,

        tools: [{ functionDeclarations: [listFileTools,readFileTools,writeFileTools] }],
      },
    });
      if (response.functionCalls && response.functionCalls.length > 0) {
          // execute all function call
          for (const functionCall of response.functionCalls) {
              const { name, args } = functionCall;
              console.log(`${name}`)
              const toolResponse = await tools[name](args);
            //   add function call to history
              History.push(response.candidates[0].content);
            //   add user response into history
              History.push({
                role: "user",
                parts: [{ functionResponse: { name, response: { result: toolResponse } } }],
              });
          }
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
const directory = process.argv[2] || '.';
console.log(directory)
await RunAgent(directory)