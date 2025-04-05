const logger = require('./logger');

// Regex patterns
const WHITESPACE_REGEX = /\s+/g;

// Normalizes whitespace in text
const normalizeWhitespace = (text) => {
  if (!text) return '';
  return text.trim().replace(WHITESPACE_REGEX, ' ');
};

// Standardizes different types of quotes
const standardizeQuotes = (text) => {
  if (!text) return '';
  // Convert all quotes (single, double, curly) to single quotes
  return text.replace(/['"''""]/g, "'");
};

// Prepare text for CSV field (without wrapping)
const prepareCSVContent = (text) => {
  if (!text) return '';
  return text.replace(/\r?\n/g, ' '); // Replace newlines with spaces
};

// Prepare and wrap CSV field if needed
const prepareCSVField = (field) => {
  if (!field) return '';
  const sanitized = standardizeQuotes(String(field));
  const prepared = prepareCSVContent(sanitized);
  // Wrap in quotes if contains comma or single quote
  return /[,']/.test(prepared) ? `"${prepared}"` : prepared;
};

// Format array of values into CSV row
const formatCSVRow = (values) => {
  if (!Array.isArray(values)) {
    return '';
  }
  return values.map(prepareCSVField).join(',');
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
  prepareCSVContent,
  prepareCSVField,
  formatCSVRow,
};
