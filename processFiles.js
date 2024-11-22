import fs from "fs-extra";
import path from "path";
import dotenv from "dotenv";
import simpleGit from "simple-git";

// Load environment variables from .env file
dotenv.config();

const BASE_PATH =
  process.env.BASE_PATH ||
  "C:/Users/Adria/Desktop/Proyectos/web-inventory-automation"; // Default base path
const FORGE_PATH = process.env.FORGE_PATH || "./"; // Default forge path
const INPUT_FILE = path.join(FORGE_PATH, "input.txt"); // Input file
const OUTPUT_FILE = path.join(FORGE_PATH, "output.txt"); // Output file

const git = simpleGit(BASE_PATH); // Initialize Git in the BASE_PATH

// Get the previous committed content of a file
const getPreviousCommittedContent = async (filePath) => {
  try {
    const relativePath = path.relative(BASE_PATH, filePath).replace(/\\/g, "/");
    console.log(`[DEBUG] Fetching committed content for: ${relativePath}`);

    // Check if the file is inside the repository and tracked
    const isTracked = await git.raw(["ls-files", relativePath]);
    if (!isTracked.trim()) {
      console.warn(
        `[DEBUG] The file '${relativePath}' is either untracked or outside the repository.`,
      );
      return null;
    }

    // Fetch the committed content
    const content = await git.show([`HEAD:${relativePath}`]);
    return content.trim();
  } catch (error) {
    if (error.message.includes("outside repository")) {
      console.warn(
        `[DEBUG] The file '${filePath}' is outside the current Git repository. Skipping...`,
      );
    } else if (error.message.includes("exists on disk, but not in 'HEAD'")) {
      console.warn(
        `[DEBUG] The file '${filePath}' exists but is not tracked in Git. Skipping committed content fetch.`,
      );
    } else {
      console.warn(
        `[DEBUG] Unable to fetch committed content for ${filePath}: ${error.message}`,
      );
    }
    return null; // Return null for errors
  }
};

// Recursively get the content of all files in a directory or process a single file
const getFileContent = async (filePath) => {
  try {
    const stats = await fs.stat(filePath);

    if (stats.isDirectory()) {
      console.log(`[DEBUG] Entering directory: ${filePath}`);
      const files = await fs.readdir(filePath, { withFileTypes: true });

      const results = [];
      for (const file of files) {
        const nestedFilePath = path.join(filePath, file.name);
        const nestedContent = await getFileContent(nestedFilePath);
        results.push(...nestedContent); // Flatten nested results
      }

      return results;
    } else if (stats.isFile()) {
      console.log(`[DEBUG] Reading file: ${filePath}`);
      const currentContent = await fs.readFile(filePath, "utf-8");
      const previousContent = await getPreviousCommittedContent(filePath);

      const result = [
        `----> [${path.basename(filePath)}]:\n\n${currentContent
          .trim()
          .replace(/^/gm, "- ")}\n\n`,
      ];

      if (previousContent) {
        result.push(
          `----> [Previous Committed - ${path.basename(
            filePath,
          )}]:\n\n${previousContent.trim().replace(/^/gm, "- ")}\n\n`,
        );
      }

      return result;
    } else {
      console.log(`[DEBUG] Skipping non-file, non-directory: ${filePath}`);
      return [];
    }
  } catch (error) {
    console.error(`[DEBUG] Error processing path: ${filePath}`, error.message);
    return [`[ERROR] Unable to process path: ${filePath}`];
  }
};

// Process files listed in input.txt
const processFiles = async () => {
  try {
    console.log(`[DEBUG] Input file path: ${INPUT_FILE}`);
    console.log(`[DEBUG] Output file path: ${OUTPUT_FILE}`);

    // Check if the input file exists
    if (!fs.existsSync(INPUT_FILE)) {
      console.error(`Input file not found: ${INPUT_FILE}`);
      return;
    }

    // Read the input file to determine directories or files to scan
    const filePaths = fs
      .readFileSync(INPUT_FILE, "utf-8")
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0); // Filter out empty lines

    if (filePaths.length === 0) {
      console.error("No file paths found in the input file.");
      return;
    }

    // Prepare output header
    const results = ["START\n---\n"];

    // Process each directory or file listed in the input file
    for (const filePath of filePaths) {
      let absolutePath;

      // Check if the file should be read from FORGE_PATH
      if (filePath.startsWith("@forge ")) {
        const trimmedPath = filePath.replace("@forge ", "").trim();
        absolutePath = path.resolve(FORGE_PATH, trimmedPath);
        console.log(`[DEBUG] Resolving path from FORGE_PATH: ${absolutePath}`);
      } else {
        absolutePath = path.resolve(BASE_PATH, filePath);
        console.log(`[DEBUG] Resolving path from BASE_PATH: ${absolutePath}`);
      }

      const content = await getFileContent(absolutePath); // Recursive traversal for directories
      results.push(...content);
    }

    // Append footer and write all collected results to the output file
    results.push("---\nEND\n");
    await fs.writeFile(OUTPUT_FILE, results.join("\n"), "utf-8");
    console.log(`Output written to: ${OUTPUT_FILE}`);
  } catch (error) {
    console.error("Error processing files:", error.message);
  }
};

// Run the script
processFiles();
