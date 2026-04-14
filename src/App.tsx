import { useState, ChangeEvent } from 'react';
import { GoogleGenAI, Type } from '@google/genai';
import { Upload, Loader2, AlertCircle, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';
import { TOP_PERFORMERS_MASTER_ANALYSIS, CREATOR_BRIEF, INTERNAL_EVALUATION_PROMPT } from './constants';

interface EvaluationResult {
  potentialPerformanceScore: number;
  generalReview: string;
  technicalImprovements: string;
  vibeAndDeliveryImprovements: string;
  creatorRecommendation: string;
  translations?: { timing: string; original: string; translated: string }[];
}

export default function App() {
  const [video, setVideo] = useState<File | null>(null);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<EvaluationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setVideo(e.target.files[0]);
      setError(null);
    }
  };

  const analyzeVideo = async () => {
    if (!video) {
      setError('Please upload a video first.');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const reader = new FileReader();
      reader.readAsDataURL(video);
      const base64Data = await new Promise<string>((resolve) => {
        reader.onload = () => resolve(reader.result as string);
      });

      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: [
          {
            parts: [
              {
                inlineData: {
                  mimeType: video.type,
                  data: base64Data.split(',')[1],
                },
              },
              {
                text: `${INTERNAL_EVALUATION_PROMPT}\n\nUser Comment: ${comment}\n\nBenchmark Context:\nMaster Analysis: ${TOP_PERFORMERS_MASTER_ANALYSIS}\nCreator Brief: ${CREATOR_BRIEF}`,
              },
            ],
          },
        ],
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              potentialPerformanceScore: { type: Type.NUMBER },
              generalReview: { type: Type.STRING },
              technicalImprovements: { type: Type.STRING },
              vibeAndDeliveryImprovements: { type: Type.STRING },
              creatorRecommendation: { type: Type.STRING },
              translations: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    timing: { type: Type.STRING },
                    original: { type: Type.STRING },
                    translated: { type: Type.STRING },
                  },
                  required: ['timing', 'original', 'translated'],
                },
              },
            },
            required: [
              'potentialPerformanceScore',
              'generalReview',
              'technicalImprovements',
              'vibeAndDeliveryImprovements',
              'creatorRecommendation',
            ],
          },
        },
      });

      const jsonStr = response.text?.trim() || '{}';
      setResult(JSON.parse(jsonStr));
    } catch (err) {
      console.error(err);
      setError('An error occurred during analysis. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black p-6 md:p-12 font-sans text-stone-300 relative overflow-hidden">
      {/* Subtle background glow */}
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-stone-900 via-black to-black -z-10" />
      
      <header className="max-w-4xl mx-auto mb-12 text-center">
        <motion.h1 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl font-bold tracking-tighter text-white mb-2 bg-clip-text text-transparent bg-gradient-to-br from-white via-stone-200 to-stone-600"
        >
          Creative Performance Analyser
        </motion.h1>
      </header>

      <main className="max-w-4xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-stone-900/50 backdrop-blur-xl p-8 rounded-3xl shadow-2xl border border-stone-800 mb-8"
        >
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-stone-400 mb-2">Upload Video</label>
              <div className="border-2 border-dashed border-stone-700 rounded-2xl p-8 text-center hover:border-stone-500 transition-colors cursor-pointer bg-stone-950/50 hover:bg-stone-900">
                <input type="file" accept="video/*" onChange={handleFileChange} className="hidden" id="video-upload" />
                <label htmlFor="video-upload" className="flex flex-col items-center cursor-pointer">
                  <Upload className="w-8 h-8 text-stone-500 mb-2" />
                  <span className="text-stone-300">{video ? video.name : 'Click or drag to upload video'}</span>
                </label>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-400 mb-2">Optional Comment</label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="w-full p-4 rounded-xl border border-stone-700 bg-stone-950/50 focus:ring-2 focus:ring-stone-500 focus:border-transparent transition-all text-stone-200"
                rows={3}
                placeholder="Add any context for the evaluator..."
              />
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={analyzeVideo}
              disabled={loading || !video}
              className="w-full bg-white text-black py-4 rounded-xl font-bold hover:bg-stone-200 transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-white/10"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
              {loading ? 'Analyzing...' : 'Analyze Video'}
            </motion.button>
            {error && <div className="text-red-400 flex items-center gap-2"><AlertCircle className="w-5 h-5" /> {error}</div>}
          </div>
        </motion.div>

        {result && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="bg-stone-900/50 backdrop-blur-xl p-8 rounded-3xl shadow-2xl border border-stone-800 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white">Performance Score</h2>
              <span className="text-6xl font-extrabold tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-white to-stone-500">{(result.potentialPerformanceScore * 100).toFixed(0)}</span>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              <ResultCard title="General Review" content={result.generalReview} />
              <ResultCard title="Technical Improvements" content={result.technicalImprovements} />
              <ResultCard title="Vibe & Delivery" content={result.vibeAndDeliveryImprovements} />
              <ResultCard title="Creator Message" content={result.creatorRecommendation} />
            </div>
            {result.translations && result.translations.length > 0 && (
              <div className="bg-stone-900/50 backdrop-blur-xl p-8 rounded-3xl shadow-2xl border border-stone-800">
                <h2 className="text-xl font-semibold text-white mb-6">Video Translation</h2>
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4 text-sm font-medium text-stone-400 uppercase tracking-wider border-b border-stone-800 pb-4">
                    <div>Timing</div>
                    <div>Original</div>
                    <div>English Translation</div>
                  </div>
                  {result.translations.map((t, i) => (
                    <div key={i} className="grid grid-cols-3 gap-4 text-stone-300 border-b border-stone-800 pb-4 last:border-0 last:pb-0">
                      <div className="font-mono text-stone-500">{t.timing}</div>
                      <div>{t.original}</div>
                      <div>{t.translated}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </main>
    </div>
  );
}

function ResultCard({ title, content }: { title: string; content: string }) {
  return (
    <motion.div 
      whileHover={{ y: -5 }}
      className="bg-stone-900/50 backdrop-blur-xl p-8 rounded-3xl shadow-2xl border border-stone-800"
    >
      <h3 className="text-sm font-semibold text-stone-400 uppercase tracking-wider mb-4">{title}</h3>
      <p className="text-stone-300 leading-relaxed">{content}</p>
    </motion.div>
  );
}
