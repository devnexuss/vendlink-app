
import { GoogleGenAI } from "@google/genai";
import { Customer } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const getGeminiBillingHelper = async (customerName: string, amount: number, dueDate: string) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Generate a polite and friendly billing notification message for a customer named ${customerName} who has an internet bill of ₱${amount} due on ${dueDate}. The message should be short, suitable for SMS or Messenger, and include a thank you note. Mention that payment can be made via GCash.`,
      config: {
        temperature: 0.7,
      },
    });
    return response.text;
  } catch (error) {
    console.error("Gemini Error:", error);
    return `Hello ${customerName}, your bill of ₱${amount} is due on ${dueDate}. Thank you!`;
  }
};

export const parseCSV = (csv: string): Customer[] => {
  const lines = csv.split('\n');
  return lines.slice(1).filter(line => line.trim() !== '').map((line, index) => {
    // Simple CSV parser that handles quotes
    const values: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let char of line) {
      if (char === '"') inQuotes = !inQuotes;
      else if (char === ',' && !inQuotes) {
        values.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current);

    const idNum = (index + 1).toString().padStart(4, '0');

    return {
      id: `cust-${index}`,
      customId: `C${idNum}`,
      name: values[0]?.trim(),
      address: values[1]?.trim(),
      contactNo: values[2]?.trim(),
      napBox: values[3]?.trim(),
      startDate: values[4]?.trim(),
      status: values[5]?.trim() === 'Active' ? 'Active' : 'Inactive',
      notes: values[6]?.trim(),
      monthlyRate: 1000 // default
    };
  });
};
