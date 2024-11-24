//The admin logged into the system at 192.168.0.1 and searched Google.

import fs from 'fs-extra';
import path from 'path';
import dotenv from 'dotenv';
import simpleGit from 'simple-git';
import { logger } from './logger.js'; // Import the logger

// Load environment variables from .env file
dotenv.config();

const BASE_PATH =
  process.env.BASE_PATH ||
  'C:/Users/Adria/Desktop/Proyectos/web-inventory-automation';
const FORGE_PATH = process.env.FORGE_PATH || './';
const INPUT_FILE = path.join(FORGE_PATH, 'input.txt');
const OUTPUT_FILE = path.join(FORGE_PATH, 'output.txt');
const AUTO_CHECK = process.env.AUTO_CHECK === 'true';

// Validate environment variables
const validateEnv = () => {
  if (!fs.existsSync(BASE_PATH)) {
    throw new Error(`Invalid BASE_PATH in .env: ${BASE_PATH}`);
  }
  if (!fs.existsSync(FORGE_PATH)) {
    throw new Error(`Invalid FORGE_PATH in .env: ${FORGE_PATH}`);
  }
};
validateEnv();

const git = simpleGit(BASE_PATH);

// Helper function to check if a file is within the BASE_PATH repository
const isFileInRepo = (filePath) => {
  const relativePath = path.relative(BASE_PATH, filePath).replace(/\\/g, '/');
  return !relativePath.startsWith('..') && !path.isAbsolute(relativePath);
};

// Validate if paths exist
const validatePaths = async (filePaths) => {
  const validPaths = [];
  for (const filePath of filePaths) {
    try {
      if (await fs.pathExists(filePath)) {
        validPaths.push(filePath);
      } else {
        logger.warn(`Path not found: ${filePath}`);
      }
    } catch (error) {
      logger.error(`Error validating path: ${filePath} - ${error.message}`);
    }
  }
  return validPaths;
};

// Get the previous committed content of a file if it is within the repository
const getPreviousCommittedContent = async (filePath) => {
  if (!isFileInRepo(filePath)) {
    logger.warn(
      `Skipping Git operations for file outside repository: ${filePath}`
    );
    return null;
  }

  try {
    const relativePath = path.relative(BASE_PATH, filePath).replace(/\\/g, '/');
    const isTracked = await git.raw(['ls-files', relativePath]);
    if (!isTracked.trim()) return null;

    const content = await git.show([`HEAD:${relativePath}`]);
    return content.trim();
  } catch (error) {
    logger.error(
      `Failed to get previous committed content for ${filePath}: ${error.message}`
    );
    return null;
  }
};

// Helper function to exclude specific files
const shouldExclude = (fileName) =>
  [
    'package-lock.json',
    'node_modules',
    '.vscode',
    '.gitignore',
    '.prettierignore',
    'eslint.config.js',
    'input.txt',
    'output.txt'
  ].includes(fileName);

// Batch processing function
const processInBatches = async (tasks, batchSize = 10) => {
  for (let i = 0; i < tasks.length; i += batchSize) {
    const batch = tasks.slice(i, i + batchSize);
    await Promise.all(batch.map((task) => task()));
  }
};

// Recursively process files with batched promises
const getFileContent = async (filePath) => {
  try {
    const stats = await fs.stat(filePath);

    if (stats.isDirectory()) {
      const files = await fs.readdir(filePath, { withFileTypes: true });

      const contentPromises = files
        .filter((file) => !shouldExclude(file.name))
        .map((file) => {
          const nestedFilePath = path.join(filePath, file.name);
          return () => getFileContent(nestedFilePath); // Return function for batching
        });

      const results = [];
      await processInBatches(contentPromises, 10);
      for (const promise of contentPromises) {
        results.push(...(await promise()));
      }
      return results.flat();
    } else if (stats.isFile()) {
      if (stats.size === 0) {
        logger.warn(`Skipping empty file: ${filePath}`);
        return [];
      }
      const currentContent = await fs.readFile(filePath, 'utf-8');
      const previousContent = await getPreviousCommittedContent(filePath);

      const result = [
        `----> [${path.basename(filePath)}]:\n\n${currentContent
          .trim()
          .replace(/^/gm, '- ')}\n\n`
      ];

      if (previousContent) {
        result.push(
          `----> [Previous Committed - ${path.basename(filePath)}]:\n\n${previousContent
            .trim()
            .replace(/^/gm, '- ')}\n\n`
        );
      }

      logger.info(`Processed file: ${filePath}`);
      return result;
    } else {
      return [];
    }
  } catch (error) {
    logger.error(`Error processing file: ${filePath} - ${error.message}`);
    return [`[ERROR] Unable to process path: ${filePath}`];
  }
};

// Process files listed in input.txt
const processInputFiles = async () => {
  try {
    if (!fs.existsSync(INPUT_FILE)) {
      throw new Error(`Input file not found: ${INPUT_FILE}`);
    }

    const filePaths = fs
      .readFileSync(INPUT_FILE, 'utf-8')
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    const validPaths = await validatePaths(filePaths);

    const contentPromises = validPaths.map((filePath) => {
      const absolutePath = filePath.startsWith('@forge ')
        ? path.resolve(FORGE_PATH, filePath.replace('@forge ', '').trim())
        : path.resolve(BASE_PATH, filePath);

      logger.debug(`[DEBUG] Resolving path: ${absolutePath}`);
      return () => getFileContent(absolutePath); // Return function for batching
    });

    const results = [];
    await processInBatches(contentPromises, 10);
    for (const promise of contentPromises) {
      results.push(...(await promise()));
    }
    return results.flat();
  } catch (error) {
    logger.error(`Error processing input files: ${error.message}`);
    return [];
  }
};

// Process root folder files if AUTO_CHECK is true
const processRootFiles = async () => {
  try {
    const files = await fs.readdir(FORGE_PATH, { withFileTypes: true });

    const contentPromises = files
      .filter((file) => !shouldExclude(file.name) && file.isFile())
      .map((file) => () => getFileContent(path.join(FORGE_PATH, file.name))); // Return function for batching

    const results = [];
    await processInBatches(contentPromises, 10);
    for (const promise of contentPromises) {
      results.push(...(await promise()));
    }
    return results.flat();
  } catch (error) {
    logger.error(`Error processing root files: ${error.message}`);
    return [];
  }
};

// Main function to process files
const processFiles = async () => {
  try {
    logger.start('Starting file processing...');
    const mode = AUTO_CHECK
      ? 'Self-Improvement (AUTO_CHECK=true)'
      : 'External-Improvement (AUTO_CHECK=false)';
    logger.info(`Running in ${mode} mode`);
    const results = ['START\n---\n'];

    const fileContents = AUTO_CHECK
      ? await processRootFiles()
      : await processInputFiles();

    results.push(...fileContents, '---\nEND\n');

    await fs.writeFile(OUTPUT_FILE, results.join('\n'), 'utf-8');
    logger.success(`Output written to: ${OUTPUT_FILE}`);
  } catch (error) {
    logger.error(`Error processing files: ${error.message}`);
  } finally {
    logger.end('File processing completed.');
  }
};

// Run the script
processFiles();
