/**
 * Scrubs common PII patterns from text before sending to LLM.
 * Replaces with placeholder tokens so context still makes sense.
 */
const scrubPII = (text) => {
  let scrubbed = text;

  // Email addresses
  scrubbed = scrubbed.replace(
    /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g,
    "[EMAIL]"
  );

  // Phone numbers (various formats)
  scrubbed = scrubbed.replace(
    /(\+?\d{1,3}[\s\-.]?)?\(?\d{3}\)?[\s\-.]?\d{3}[\s\-.]?\d{4}/g,
    "[PHONE]"
  );

  // Credit card numbers
  scrubbed = scrubbed.replace(/\b\d{4}[\s\-]?\d{4}[\s\-]?\d{4}[\s\-]?\d{4}\b/g, "[CARD]");

  // Social Security Numbers
  scrubbed = scrubbed.replace(/\b\d{3}[-\s]?\d{2}[-\s]?\d{4}\b/g, "[SSN]");

  // IP addresses
  scrubbed = scrubbed.replace(
    /\b(?:\d{1,3}\.){3}\d{1,3}\b/g,
    "[IP_ADDRESS]"
  );

  // Physical addresses (basic heuristic)
  scrubbed = scrubbed.replace(
    /\b\d+\s+[A-Za-z]+\s+(Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Lane|Ln|Drive|Dr|Court|Ct)\b/gi,
    "[ADDRESS]"
  );

  return scrubbed;
};

module.exports = { scrubPII };
