import { convertToCoreMessages } from 'ai';

const uiMessages = [
  {
    role: 'user',
    content: 'Analyze this',
    experimental_attachments: [
      {
        name: 'test.png',
        contentType: 'image/png',
        url: 'data:image/png;base64,iVBORw0KGgo='
      }
    ]
  }
];

const coreMessages = convertToCoreMessages(uiMessages);
console.log(JSON.stringify(coreMessages, null, 2));
