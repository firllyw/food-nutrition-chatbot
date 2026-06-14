import { streamText } from 'ai';
import { google } from '@ai-sdk/google';

async function test() {
  const result = await streamText({
    model: google('gemini-2.5-flash'),
    prompt: 'Hello',
  });
  console.log("Keys:", Object.keys(result));
  console.log("Prototype keys:", Object.getOwnPropertyNames(Object.getPrototypeOf(result)));
}
test();
