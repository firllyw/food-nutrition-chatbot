import { streamText } from 'ai';

async function test() {
  const mockModel = {
    specificationVersion: 'v1',
    provider: 'mock',
    modelId: 'mock-model',
    async doStream(options) {
      return {
        stream: new ReadableStream({
          start(controller) {
            controller.enqueue({ type: 'text-delta', textDelta: 'Hello' });
            controller.close();
          }
        }),
        rawCall: { rawPrompt: 'test', rawSettings: {} },
      };
    }
  };

  const result = await streamText({
    model: mockModel,
    prompt: 'Hello',
  });
  console.log("Keys:", Object.keys(result));
  console.log("Prototype keys:", Object.getOwnPropertyNames(Object.getPrototypeOf(result)));
}
test();
