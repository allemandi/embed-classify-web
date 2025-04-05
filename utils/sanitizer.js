const logger = require('./logger');

// Regex patterns
const WHITESPACE_REGEX = /\s+/g;
const QUOTE_REGEX = /[''""]/g;

// Normalizes whitespace in text
const normalizeWhitespace = (text) => {
  if (!text) return '';
  return text.trim().replace(WHITESPACE_REGEX, ' ');
};

// Standardizes different types of quotes
const standardizeQuotes = (text) => {
  if (!text) return '';
  return text.replace(QUOTE_REGEX, '"');
};

// Main sanitization function
const sanitizeText = (text) => {
  try {
    if (!text || typeof text !== 'string') {
      logger.warn('Invalid input received for sanitization');
      return '';
    }
    // Chain operations
    return normalizeWhitespace(standardizeQuotes(text));
  } catch (error) {
    logger.error(`Text sanitization failed: ${error.message}`);
    return text; // Return original text if sanitization fails
  }
};

 // Batch sanitize an array of texts
const batchSanitize = (texts) => {
  if (!Array.isArray(texts)) {
    logger.error('Invalid input: expected array of texts');
    return [];
  }
  return texts.map((text, index) => {
    try {
      return sanitizeText(text);
    } catch (error) {
      logger.error(`Failed to sanitize text at index ${index}`);
      return text;
    }
  });
};

module.exports = {
  normalizeWhitespace,
  standardizeQuotes,
  sanitizeText,
  batchSanitize,
};
