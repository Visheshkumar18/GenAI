import {GoogleGenAI} from '@google/genai';
import 'dotenv/config'
const ai=new GoogleGenAI({});
async function main(){
    const response=await ai.models.generateContent({
        model:"gemini-3-flash-preview",
        contents:[
            {
                role:"user",
                parts:[{text:"what is system design in short "}]
            },
            {
                role:"model",
                parts:[{text:"Think of it as the **blueprint** for building an application"}]
            }
        ]
    })
    console.log(response.text);
}
await main();
