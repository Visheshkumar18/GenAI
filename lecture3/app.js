import {GoogleGenAI} from '@google/genai';
import 'dotenv/config'
import readlineSync from 'readline-sync'
const ai=new GoogleGenAI({});
async function main(){
  const chat=ai.chats.create({
    model:"gemini-2.5-flash",
    history:[],
    config:{
        systemInstruction:`you are a coding tutor,
        strict rule to follow
        - you will only answer which is related to coding
        -don't answer anything which is not related to coding
        `
    }
  }) ;
  while(true){
    const question=readlineSync.question("Ask me Question :");
    if(question=='exit')break;
    const response=await chat.sendMessage({
        message:question
    });
    console.log("Response",response.text);
  }
}
await main();
