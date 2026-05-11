const fs = require("fs");
const path = require("path");
const pdfParse = require("pdf-parse");
const mammoth = require("mammoth");

/**
 * Extract raw text from an uploaded file based on its MIME/extension.
 * @param {string} filePath - Absolute path to the uploaded file
 * @param {string} mimeType - e.g. "application/pdf"
 * @returns {{ text: string, pageCount?: number, wordCount: number }}
 */
async function extractText(filePath, mimeType) {
  const ext = path.extname(filePath).toLowerCase();

  if (mimeType === "application/pdf" || ext === ".pdf") {
    const buffer = fs.readFileSync(filePath);
    const data = await pdfParse(buffer);
    return {
      text: data.text,
      pageCount: data.numpages,
      wordCount: data.text.split(/\s+/).filter(Boolean).length,
    };
  }

  if (
    mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    ext === ".docx"
  ) {
    const result = await mammoth.extractRawText({ path: filePath });
    const text = result.value;
    return {
      text,
      wordCount: text.split(/\s+/).filter(Boolean).length,
    };
  }

  if (
    mimeType === "text/plain" ||
    mimeType === "text/markdown" ||
    ext === ".txt" ||
    ext === ".md"
  ) {
    const text = fs.readFileSync(filePath, "utf8");
    return {
      text,
      wordCount: text.split(/\s+/).filter(Boolean).length,
    };
  }

  throw new Error(`Unsupported file type: ${mimeType || ext}`);
}

module.exports = { extractText };
