function splitIntoChunks(text, chunkSize = 800, overlap = 150) {
  const chunks = [];
  let start = 0;
  const cleaned = text.replace(/\s+/g, " ").trim();
  while (start < cleaned.length) {
    let end = start + chunkSize;
    if (end < cleaned.length) {
      const boundary = cleaned.lastIndexOf(". ", end);
      if (boundary > start + chunkSize / 2) end = boundary + 1;
    }
    const chunk = cleaned.slice(start, end).trim();
    if (chunk.length > 50) chunks.push(chunk);
    start = end - overlap;
  }
  return chunks;
}

const STOPWORDS = new Set([
  "the","a","an","and","or","but","in","on","at","to","for","of","with",
  "by","from","as","is","was","are","were","be","been","being","have",
  "has","had","do","does","did","will","would","could","should","may",
  "might","shall","can","this","that","these","those","it","its","not",
  "also","more","than","about","into","after","before","between","through",
  "during","each","other","which","when","where","who","how","what","they",
  "their","them","there","then","than","so","if","all","any","both",
]);

function tokenize(text) {
  return text.toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/)
    .filter((w) => w.length > 2 && !STOPWORDS.has(w));
}

function computeTermFreq(text) {
  const tokens = tokenize(text);
  const freq = {};
  for (const t of tokens) freq[t] = (freq[t] || 0) + 1;
  return freq;
}

function bm25Score(queryTokens, chunkFreq, chunkLen, avgChunkLen, k1 = 1.5, b = 0.75) {
  let score = 0;
  for (const term of queryTokens) {
    const tf = chunkFreq[term] || 0;
    if (tf === 0) continue;
    score += (tf * (k1 + 1)) / (tf + k1 * (1 - b + b * (chunkLen / avgChunkLen)));
  }
  return score;
}

async function queryKnowledgeBase(query, knowledgeBaseId, topK = 5) {
  const Document = require("../models/Document");
  const docs = await Document.find({ knowledgeBase: knowledgeBaseId, status: "ready" })
    .select("name chunks").lean();
  if (!docs.length) return [];

  const allChunks = [];
  for (const doc of docs) {
    for (const chunk of doc.chunks) {
      allChunks.push({
        content: chunk.content,
        chunkIndex: chunk.chunkIndex,
        page: chunk.page,
        documentId: doc._id.toString(),
        documentName: doc.name,
        termFreq: computeTermFreq(chunk.content), // always recompute — fixes Mongoose Map bug
      });
    }
  }
  if (!allChunks.length) return [];

  const avgLen = allChunks.reduce((s, c) => s + tokenize(c.content).length, 0) / allChunks.length;
  const queryTokens = tokenize(query);
  if (!queryTokens.length) return [];

  const scored = allChunks
    .map((c) => ({ ...c, score: bm25Score(queryTokens, c.termFreq, tokenize(c.content).length, avgLen) }))
    .sort((a, b) => b.score - a.score);

  let results = scored.slice(0, topK).filter((c) => c.score > 0);
  if (!results.length) results = scored.slice(0, 3); // fallback

  return results.map((r) => ({
    content: r.content, score: Math.min(r.score / 10, 1),
    documentId: r.documentId, documentName: r.documentName,
    chunkIndex: r.chunkIndex, page: r.page,
  }));
}

function processChunks(chunks) {
  return chunks.map((content, chunkIndex) => ({ content, chunkIndex, termFreq: computeTermFreq(content) }));
}

module.exports = { splitIntoChunks, processChunks, queryKnowledgeBase };