/**
 * Direct Client-Side Gemini Fallback for Static Hosting (e.g. GitHub Pages)
 * When running without an Express backend, this service communicates directly
 * with the Gemini 2.5 Flash API using the user's provided API key.
 */

import { RawAiAnalysisResponse } from '../types/fishbone';

const SYSTEM_INSTRUCTION = `You are an expert Root Cause Analysis (RCA) facilitator and industrial safety engineer.
Your job is to analyze incident descriptions and chronology, determine the core problem, and construct a comprehensive Fishbone (Ishikawa) Diagram structure categorized into the standard 6M framework:
1. Machine (Peralatan, mesin, sensor, perkakas)
2. Method (SOP, prosedur kerja, instruksi, komunikasi shift)
3. Material (Bahan baku, suku cadang, pelumas, sifat zat kimia)
4. Measurement (Alat ukur, kalibrasi, sensor pembacaan, toleransi)
5. Man (Manusia, pelatihan, kelelahan, pengawasan, kompetensi)
6. Environment (Kondisi kerja, suhu, pencahayaan, cuaca, tata letak)

CRITICAL INSTRUCTIONS:
- Identify the primary Problem statement concisely (3 to 7 words).
- Provide a summary Conclusion of the root cause.
- Group identified causes into the 6M categories (include all 6 categories; if no direct cause exists for a category, leave causes array empty []).
- For EACH cause:
  - Provide a clear cause description ("cause")
  - Provide 1 to 3 bullet points / supporting technical details ("details")
  - Provide a specific, actionable recommendation ("action_plan") to correct and prevent recurrence.
- Return ONLY valid JSON adhering strictly to the schema (no markdown formatting, no code blocks):
{
  "problem": "Concise problem statement (3-7 words)",
  "conclusion": "Summary of the primary root cause",
  "analysis": [
    {
      "category": "Machine",
      "causes": [
        {
          "cause": "Main cause title",
          "details": ["Detail 1", "Detail 2"],
          "action_plan": "Specific action plan"
        }
      ]
    },
    { "category": "Method", "causes": [] },
    { "category": "Material", "causes": [] },
    { "category": "Measurement", "causes": [] },
    { "category": "Man", "causes": [] },
    { "category": "Environment", "causes": [] }
  ]
}`;

export async function analyzeIncidentDirectly(
  description: string,
  apiKey: string
): Promise<RawAiAnalysisResponse> {
  const cleanKey = apiKey.trim();
  if (!cleanKey) {
    throw new Error('API Key belum diisi. Silakan masukkan API Key Gemini Anda di menu Pengaturan.');
  }

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${cleanKey}`;

  const payload = {
    contents: [
      {
        parts: [
          {
            text: `Analyze this incident report and create the 6M Fishbone RCA:\n\n${description.trim()}`,
          },
        ],
      },
    ],
    systemInstruction: {
      parts: [{ text: SYSTEM_INSTRUCTION }],
    },
    generationConfig: {
      responseMimeType: 'application/json',
      temperature: 0.2,
    },
  };

  const maxRetries = 4;
  let attempt = 0;
  let delayMs = 1200;

  while (attempt < maxRetries) {
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const result = await response.json();
        const candidateText =
          result.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!candidateText) {
          throw new Error('Gemini API tidak memberikan teks balasan.');
        }

        const parsed = JSON.parse(candidateText.trim());
        return parsed as RawAiAnalysisResponse;
      }

      if (response.status === 429 || response.status === 503) {
        await new Promise((r) => setTimeout(r, delayMs));
        attempt++;
        delayMs *= 2;
        continue;
      }

      const errBody = await response.text();
      let parsedErrMessage = errBody;
      try {
        const errJson = JSON.parse(errBody);
        parsedErrMessage = errJson.error?.message || errBody;
      } catch {
        // use raw text
      }

      throw new Error(`Gemini API Error (${response.status}): ${parsedErrMessage}`);
    } catch (err: unknown) {
      if (attempt >= maxRetries - 1) {
        throw err;
      }
      await new Promise((r) => setTimeout(r, delayMs));
      attempt++;
      delayMs *= 2;
    }
  }

  throw new Error('Gagal menghubungi Gemini API setelah 4 kali percobaan.');
}
