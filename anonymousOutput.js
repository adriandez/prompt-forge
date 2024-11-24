import fs from 'fs-extra';
import path from 'path';
import { logger } from './logger.js'; // Import the logger

// File paths
const FORGE_PATH = process.env.FORGE_PATH || './';
const OUTPUT_FILE = path.join(FORGE_PATH, 'output.txt');
const ANONYMOUS_OUTPUT_FILE = path.join(FORGE_PATH, 'output-anonymous.txt');
const KEYWORDS_FILE = path.join(FORGE_PATH, 'keywords.json');

// Load keywords for replacement
let keywordsMap = {};
if (fs.existsSync(KEYWORDS_FILE)) {
  try {
    keywordsMap = JSON.parse(fs.readFileSync(KEYWORDS_FILE, 'utf-8'));
    logger.info('Keywords loaded successfully for anonymization.');
  } catch (error) {
    logger.error(`Failed to load keywords file: ${error.message}`);
  }
} else {
  logger.warn('No keywords.json file found. Proceeding without anonymization.');
}

// Replace keywords in content
const replaceKeywords = (content) => {
  for (const [keyword, replacement] of Object.entries(keywordsMap)) {
    const regex = new RegExp(`\\b${keyword}\\b`, 'g'); // Match exact word
    content = content.replace(regex, replacement);
  }
  return content;
};

// Main function to anonymize output
const anonymizeOutput = async () => {
  try {
    if (!fs.existsSync(OUTPUT_FILE)) {
      throw new Error(`Output file not found: ${OUTPUT_FILE}`);
    }

    // Read content from the original output file
    const originalContent = await fs.readFile(OUTPUT_FILE, 'utf-8');
    logger.info('Original output file read successfully.');

    // Replace sensitive keywords
    const anonymizedContent = replaceKeywords(originalContent);

    // Write anonymized content to a new file
    await fs.writeFile(ANONYMOUS_OUTPUT_FILE, anonymizedContent, 'utf-8');
    logger.success(`Anonymized output written to: ${ANONYMOUS_OUTPUT_FILE}`);
  } catch (error) {
    logger.error(`Error anonymizing output: ${error.message}`);
  }
};

// Run the script
anonymizeOutput();
