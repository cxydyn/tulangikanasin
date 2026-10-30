import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '10mb' }));

// Shared Gemini client with required User-Agent
const apiKey = process.env.GEMINI_API_KEY || '';
const ai = apiKey
  ? new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    })
  : null;

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    hasApiKey: Boolean(process.env.GEMINI_API_KEY),
    timestamp: new Date().toISOString(),
  });
});

// AI Fishbone Analysis endpoint
app.post('/api/analyze', async (req, res) => {
  const { description } = req.body;

  if (!description || typeof description !== 'string' || !description.trim()) {
    return res.status(400).json({
      error: 'Deskripsi insiden tidak boleh kosong. Harap masukkan kronologi insiden.',
    });
  }

  if (!ai) {
    return res.status(500).json({
      error: 'GEMINI_API_KEY belum disetel pada server. Pastikan API key telah ditambahkan di Settings > Secrets.',
    });
  }

  const systemInstruction = `You are an expert Root Cause Analysis (RCA) facilitator and industrial safety engineer.
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
- Return structured output adhering strictly to the JSON schema.`;

  const maxRetries = 4;
  let attempt = 0;
  let delayMs = 1000;

  while (attempt < maxRetries) {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Analyze this incident report and create the 6M Fishbone RCA:\n\n${description.trim()}`,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              problem: {
                type: Type.STRING,
                description: 'Concise problem statement (3-7 words)',
              },
              conclusion: {
                type: Type.STRING,
                description: 'Summary of the primary root cause',
              },
              analysis: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    category: {
                      type: Type.STRING,
                      description: 'Category name (Machine, Method, Material, Measurement, Man, Environment)',
                    },
                    causes: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          cause: {
                            type: Type.STRING,
                            description: 'Main cause title',
                          },
                          details: {
                            type: Type.ARRAY,
                            items: { type: Type.STRING },
                            description: 'Supporting technical details or sub-causes',
                          },
                          action_plan: {
                            type: Type.STRING,
                            description: 'Specific corrective or preventive action plan',
                          },
                        },
                        required: ['cause', 'details', 'action_plan'],
                      },
                    },
                  },
                  required: ['category', 'causes'],
                },
              },
            },
            required: ['problem', 'conclusion', 'analysis'],
          },
        },
      });

      const responseText = response.text;
      if (!responseText) {
        throw new Error('AI tidak memberikan respon teks yang valid.');
      }

      // Robust JSON cleaning if backticks or markdown fences are returned
      const cleanJson = responseText
        .replace(/^```(?:json)?\s*/i, '')
        .replace(/\s*```$/i, '')
        .trim();

      const parsedData = JSON.parse(cleanJson);
      return res.json(parsedData);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      console.warn(`[Gemini API Attempt ${attempt + 1}/${maxRetries} Failed]:`, errorMsg);

      // Check if retryable error (rate limit, server 503, network transient)
      const isRateLimitOrBusy =
        errorMsg.includes('429') ||
        errorMsg.includes('503') ||
        errorMsg.includes('RESOURCE_EXHAUSTED') ||
        errorMsg.includes('fetch failed') ||
        errorMsg.includes('ECONNRESET');

      if (isRateLimitOrBusy && attempt < maxRetries - 1) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
        attempt++;
        delayMs *= 2;
        continue;
      }

      // If non-retryable or retries exhausted
      return res.status(500).json({
        error: `Gagal memproses analisis AI: ${errorMsg}`,
      });
    }
  }

  return res.status(503).json({
    error: 'Server AI sedang sibuk setelah beberapa kali percobaan. Silakan coba lagi beberapa saat.',
  });
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Fishbone AI Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
