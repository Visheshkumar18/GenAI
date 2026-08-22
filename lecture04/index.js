import { GoogleGenAI } from "@google/genai";
import dotenv from 'dotenv'
dotenv.config();
async function getWeatherInformation(city){
    const apiKey=process.env.WEATHER_API_KEY;
    const response=await fetch(`http://api.weatherapi.com/v1/current.json?key=${apiKey}&q=${city}&aqi=no`);
    const data=await response.json();
    console.log("data",data);
}
getWeatherInformation('India')