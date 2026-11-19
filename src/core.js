// DocuChat core: chunking + BM25 retrieval + grounded extractive answer.
// Production swaps bm25 for pgvector cosine search + Gemini generation (see README).

export const STOP = new Set('yang dan di ke dari untuk dengan pada adalah itu ini atau the a an of to in is are for on and with as by be it at'.split(' '));

export function tokenize(t) {
  return (t.toLowerCase().match(/[a-z0-9À-ɏ]+/g) || []).filter(w => w.length > 1 && !STOP.has(w));
}

/** pages: [{page, text}] -> chunks [{id, page, text}] (~size chars, with overlap, sentence aware) */
export function chunkPages(pages, size = 450, overlap = 80) {
  const out = [];
  for (const { page, text } of pages) {
    const sentences = text.replace(/\s+/g, ' ').match(/[^.!?\n]+[.!?]?/g) || [];
    let buf = '';
    for (const s of sentences) {
      if (buf.length + s.length > size && buf) {
        out.push({ id: out.length, page, text: buf.trim() });
        buf = buf.slice(Math.max(0, buf.length - overlap));
      }
      buf += s + ' ';
    }
    if (buf.trim()) out.push({ id: out.length, page, text: buf.trim() });
  }
  return out;
}

export function buildIndex(chunks) {
  const df = new Map(); let total = 0;
  const docs = chunks.map(c => {
    const toks = tokenize(c.text); total += toks.length;
    const tf = new Map(); toks.forEach(t => tf.set(t, (tf.get(t) || 0) + 1));
    tf.forEach((_, t) => df.set(t, (df.get(t) || 0) + 1));
    return { c, tf, len: toks.length };
  });
  return { docs, df, avg: total / Math.max(1, docs.length), n: docs.length };
}

export function search(index, query, k = 3) {
  const q = tokenize(query), k1 = 1.5, b = 0.75;
  return index.docs.map(({ c, tf, len }) => {
    let s = 0;
    for (const t of q) {
      const f = tf.get(t); if (!f) continue;
      const idf = Math.log(1 + (index.n - (index.df.get(t) || 0) + 0.5) / ((index.df.get(t) || 0) + 0.5));
      s += idf * (f * (k1 + 1)) / (f + k1 * (1 - b + b * len / index.avg));
    }
    return { chunk: c, score: s };
  }).filter(r => r.score > 0).sort((a, b) => b.score - a.score).slice(0, k);
}

/** Grounded answer: only sentences from retrieved chunks. Below threshold => refuse (anti-hallucination). */
export function answer(index, query, { minScore = 0.3 } = {}) {
  const hits = search(index, query, 3);
  if (!hits.length || hits[0].score < minScore) {
    return { text: 'Maaf, saya tidak menemukan jawabannya di dokumen yang diunggah. Silakan hubungi tim support.', citations: [], grounded: false };
  }
  const qt = new Set(tokenize(query)); const picks = [];
  hits.forEach((h, i) => {
    const sents = h.chunk.text.match(/[^.!?]+[.!?]?/g) || [];
    sents.map(s => ({ s: s.trim(), n: tokenize(s).filter(t => qt.has(t)).length }))
      .filter(x => x.n > 0).sort((a, b) => b.n - a.n).slice(0, 2)
      .forEach(x => picks.push({ ...x, ref: i + 1 }));
  });
  const seen = new Set(); const uniq = picks.filter(p => !seen.has(p.s) && seen.add(p.s)).slice(0, 3);
  const text = uniq.map(p => `${p.s} [${p.ref}]`).join(' ');
  return { text, grounded: true, citations: hits.map((h, i) => ({ ref: i + 1, page: h.chunk.page, snippet: h.chunk.text.slice(0, 160), score: +h.score.toFixed(2) })) };
}
