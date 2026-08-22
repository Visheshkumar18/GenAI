// crypto currency tool
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import readlineSync from "readline-sync";
dotenv.config();
const crypto_api = process.env.CRYPTO_API_KEY;
const weather_api = process.env.WEATHER_API_KEY;
const ai = new GoogleGenAI({});
// tool 1;
async function cryptoCurrency({ coin }) {
  const response = await fetch(
    `https://api.coingecko.com/api/v3/simple/price?names=${coin}&vs_currencies=inr&x_cg_demo_api_key=${crypto_api}`,
  );
  const data = await response.json();
  return data;
}
// tool 2
async function weather({ city }) {
  const response = await fetch(
    `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${weather_api}`,
  );
  const data = await response.json();
  return data;
}
const weatherToolInfo = {
  name: "weather",
  description: "it tell the weather of a particular city e.g. london",
  parameters: {
    type: Type.OBJECT,
    properties: {
      city: {
        type: Type.STRING,
        description: "it tell the city name e.g. america, london ",
      },
    },
    required: ["city"],
  },
};
const cryptoToolInfo = {
  name: "cryptoCurrency",
  description: "it tell the price of the coin e.g. bitcoin",
  parameters: {
    type: Type.OBJECT,
    properties: {
      coin: {
        type: Type.STRING,
        description: "it tell the name of coin e.g. bitcoin solana",
      },
    },
    required: ["coin"],
  },
};
const History = [];
const GivetoolId = {
  "weather": weather,
  "cryptoCurrency": cryptoCurrency,
};
async function RunAgent() {
  let response = await ai.models.generateContent({
    model: "gemini-3.5-flash-lite",
    contents: History,
    config: {
      tools: [
        {
          functionDeclarations: [weatherToolInfo, cryptoToolInfo],
        },
      ],
    },
  });
  if (response.functionCalls && response.functionCalls.length > 0) {
    console.log("function called")
    console.dir(response, { depth: null });
    // response.functionCalls -->return an array function-call object with parameter like {name:"name of function"  args: { all argument that are required} }
    const FunctionCall = response.functionCalls[0];
    const { name, args } = FunctionCall;
    /* main question arise how you call that function becoz it give name of function in string
         Approach 1 if(name=="weather"){call that function.. } but this is very lengthy way or inefficient way
         Approach 2 --> we create a oject where keys are string with same functionName and value are function  */
    const result = await GivetoolId[name](args);
    const FunctionResponse = {
      name,
      response: result,
    };
    // History.push({
    //   role: "model",
    //   parts: [{ functionCall: FunctionCall }],
    // });
    console.dir(response, { depth: null });
    History.push(response.candidates[0].content); 
    History.push({
      role: "user",
      parts: [{ functionResponse: FunctionResponse }],
    });
    // again calling the ai
    response = await ai.models.generateContent({
      model: "gemini-3.5-flash-lite",
      contents: History,
      config: {
        tools: [
          {
            functionDeclarations: [weatherToolInfo, cryptoToolInfo],
          },
        ],
      },
    });
    console.log(response.text);
  } else {
    console.log(response.text);
  }
}
while (true) {
  const question = readlineSync.question("ASK ME ANYTHING: ");
  if (question == "exit") {
    break;
  }
  History.push({
    role: "user",
    parts: [{ text: question }],
  });
  await RunAgent();
}
