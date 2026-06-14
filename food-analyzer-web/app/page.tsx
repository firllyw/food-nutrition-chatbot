'use client';

import { useChat } from 'ai/react';
import { useState, useRef } from 'react';
import NutritionLabel from './components/NutritionLabel';

export default function NutritionLabelApp() {
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { messages, append, isLoading, input, handleInputChange, handleSubmit } = useChat({
    api: process.env.NEXT_PUBLIC_API_URL ? `${process.env.NEXT_PUBLIC_API_URL}/api/get-nutrition` : 'http://localhost:3001/api/get-nutrition',
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    const base64Image = await convertFileToBase64(file);

    append({
      role: 'user',
      content: 'Analyze the food in this image and provide an FDA standard nutrition label JSON.',
      annotations: [
        {
          type: 'image',
          url: base64Image,
        }
      ]
    });

    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="container">
      <h1>Food Analyzer</h1>

      {messages.length === 0 && (
        <form onSubmit={handleUploadSubmit} className="upload-form">
          <input type="file" accept="image/*" onChange={handleFileChange} ref={fileInputRef} />
          <button type="submit" className="btn" disabled={!file || isLoading}>
            {isLoading ? 'Analyzing...' : 'Analyze Image'}
          </button>
        </form>
      )}

      {messages.length > 0 && (
        <div className="chat-container">
          <div className="messages">
            {messages.map((m) => {
              let parsedJson = null;
              let isJson = false;
              
              if (m.role === 'assistant') {
                try {
                  parsedJson = JSON.parse(m.content);
                  isJson = true;
                } catch (e) {
                  isJson = false;
                }
              }

              return (
                <div key={m.id} className={`message ${m.role}`}>
                  <strong>{m.role === 'user' ? 'You' : 'Nutritionist'}:</strong>
                  
                  {m.annotations && m.annotations.map((annotation: any, index) => (
                    <div key={index}>
                      {annotation.type === 'image' && (
                        <img src={annotation.url} alt="uploaded food" style={{ maxWidth: '200px', display: 'block', margin: '0.5rem 0' }} />
                      )}
                    </div>
                  ))}

                  <div style={{ marginTop: '0.5rem' }}>
                    {isJson && parsedJson ? (
                      <NutritionLabel data={parsedJson} />
                    ) : (
                      <span style={{ whiteSpace: 'pre-wrap' }}>{m.content}</span>
                    )}
                  </div>
                </div>
              );
            })}
            {isLoading && <div className="message assistant">Typing...</div>}
          </div>

          <form onSubmit={handleSubmit} className="chat-input-form">
            <input
              value={input}
              onChange={handleInputChange}
              placeholder="Ask a question about the food..."
              disabled={isLoading}
            />
            <button type="submit" className="btn" disabled={isLoading || !input.trim()}>
              Send
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

async function convertFileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
    reader.readAsDataURL(file);
  });
}
