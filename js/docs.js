/*
 * DOCS — the student's own study materials, processed entirely in the browser.
 *
 *   Upload → Validate → Extract (pdf.js / text) → Normalize → Match concepts → Save (IndexedDB)
 *
 * Files never leave the device. Only when the student asks the tutor about a document are the
 * few most relevant pages sent with that one message. Deleting removes the file, its extracted
 * text, its analysis and its concept index entry.
 */
(function () {
  "use strict";
  const DB = "campfire-prep-docs", STORE = "docs";
  const INDEX_KEY = "campfire-prep.docindex.v1"; // { docId: [conceptIds covered] } — used by recommendations
  const MAX_BYTES = 10 * 1024 * 1024, MAX_PAGES = 80;
  const TYPES = { "application/pdf": "pdf", "text/plain": "text", "text/markdown": "text" };
  let mem = null; // in-memory fallback if IndexedDB is unavailable

  function db() {
    return new Promise((resolve, reject) => {
      if (!("indexedDB" in window)) return reject(new Error("no-idb"));
      const req = indexedDB.open(DB, 1);
      req.onupgradeneeded = () => req.result.createObjectStore(STORE, { keyPath: "id" });
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }
  async function tx(mode, fn) {
    try {
      const d = await db();
      return await new Promise((resolve, reject) => {
        const t = d.transaction(STORE, mode), st = t.objectStore(STORE);
        const r = fn(st);
        t.oncomplete = () => resolve(r && "result" in r ? r.result : undefined);
        t.onerror = () => reject(t.error);
      });
    } catch (e) {
      mem = mem || new Map();
      const fake = { put: (v) => { mem.set(v.id, v); }, delete: (k) => { mem.delete(k); }, get: (k) => ({ result: mem.get(k) }), getAll: () => ({ result: [...mem.values()] }) };
      const r = fn(fake);
      return r && "result" in r ? r.result : undefined;
    }
  }
  const list = async () => ((await tx("readonly", (s) => s.getAll())) || []).sort((a, b) => b.added - a.added);
  const get = (id) => tx("readonly", (s) => s.get(id));

  function setIndex(id, concepts) {
    try {
      const idx = JSON.parse(localStorage.getItem(INDEX_KEY) || "{}");
      if (concepts) idx[id] = concepts; else delete idx[id];
      localStorage.setItem(INDEX_KEY, JSON.stringify(idx));
    } catch { /* ignore */ }
  }

  async function remove(id) {
    await tx("readwrite", (s) => s.delete(id));
    setIndex(id, null);
  }

  // ───────── extraction ─────────
  let pdfjsLoading = null;
  function loadPdfJs() {
    if (window.pdfjsLib) return Promise.resolve(window.pdfjsLib);
    if (pdfjsLoading) return pdfjsLoading;
    const base = window.PDFJS_BASE || "vendor/pdfjs/";
    pdfjsLoading = new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = base + "pdf.min.js";
      s.onload = () => { window.pdfjsLib.GlobalWorkerOptions.workerSrc = base + "pdf.worker.min.js"; resolve(window.pdfjsLib); };
      s.onerror = () => { pdfjsLoading = null; reject(new Error("The PDF reader couldn't load. Check that the vendor/pdfjs folder was uploaded.")); };
      document.head.appendChild(s);
    });
    return pdfjsLoading;
  }

  async function extractPdf(buf, onProgress) {
    const pdfjs = await loadPdfJs();
    let doc;
    try { doc = await pdfjs.getDocument({ data: buf, isEvalSupported: false }).promise; }
    catch (e) { throw new Error(/password/i.test(e.message) ? "This PDF is password-protected." : "This file couldn't be read as a PDF. It may be damaged."); }
    if (doc.numPages > MAX_PAGES) throw new Error(`This PDF has ${doc.numPages} pages. The limit is ${MAX_PAGES}.`);
    const pages = [];
    for (let i = 1; i <= doc.numPages; i++) {
      const page = await doc.getPage(i);
      const tc = await page.getTextContent();
      let last = null, text = "";
      for (const item of tc.items) {
        if (last !== null && Math.abs(item.transform[5] - last) > 2) text += "\n"; else if (text && !text.endsWith(" ")) text += " ";
        text += item.str;
        last = item.transform[5];
      }
      pages.push(normalize(text));
      if (onProgress) onProgress(i / doc.numPages);
    }
    return pages;
  }

  function normalize(t) {
    return String(t).replace(/ /g, " ").replace(/[ \t]+/g, " ").replace(/ ?\n ?/g, "\n").replace(/\n{3,}/g, "\n\n").replace(/\bsqrt\s*\(/gi, "√(").trim();
  }

  // Plain text: split into ~2500-character sections so references stay useful.
  function splitText(t) {
    const clean = normalize(t);
    const out = [];
    let buf = "";
    for (const para of clean.split(/\n\s*\n|\f/)) {
      if ((buf + "\n\n" + para).length > 2500 && buf) { out.push(buf); buf = para; } else buf = buf ? buf + "\n\n" + para : para;
    }
    if (buf) out.push(buf);
    return out.length ? out : [""];
  }

  function kindOf(file) {
    if (TYPES[file.type]) return TYPES[file.type];
    if (/\.pdf$/i.test(file.name)) return "pdf";
    if (/\.(txt|md|markdown)$/i.test(file.name)) return "text";
    return null;
  }

  async function add(file, onStatus) {
    const kind = kindOf(file);
    if (!kind) throw new Error("That file type isn't supported. Upload a PDF, .txt or .md file.");
    if (file.size > MAX_BYTES) throw new Error(`That file is ${(file.size / 1048576).toFixed(1)} MB. The limit is 10 MB.`);
    if (!file.size) throw new Error("That file is empty.");
    onStatus && onStatus("Reading…", 0.05);
    let pages;
    if (kind === "pdf") pages = await extractPdf(await file.arrayBuffer(), (f) => onStatus && onStatus("Extracting text…", 0.1 + f * 0.8));
    else pages = splitText(await file.text());
    const chars = pages.join("").replace(/\s/g, "").length;
    if (chars < 40 * Math.max(1, pages.length * 0.3)) {
      throw new Error(kind === "pdf" ? "No readable text was found. This looks like a scanned PDF (images of pages), and scanned PDFs aren't supported yet. Try a PDF exported from a document, or paste the text into a .txt file." : "The file doesn't contain enough text to analyse.");
    }
    onStatus && onStatus("Matching concepts…", 0.95);
    const analysis = window.Learning.analyzeDocument(pages, window.Concepts.CONCEPTS);
    const doc = {
      id: "doc-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      name: String(file.name).slice(0, 120), size: file.size, kind, unit: kind === "pdf" ? "page" : "section",
      pages, chars, added: Date.now(), analysis,
    };
    await tx("readwrite", (s) => s.put(doc));
    setIndex(doc.id, analysis.covered); // only clearly covered topics influence recommendations
    onStatus && onStatus("Done", 1);
    return doc;
  }

  window.Docs = { add, list, get, remove, MAX_PAGES, MAX_BYTES, persistent: () => !mem };
})();
