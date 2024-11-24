# Process Files Script (`processFiles.js`)

This script automates the extraction and comparison of file contents in a directory structure. It processes files or directories specified in an `input.txt` file and outputs the results, including current and previously committed file content (if applicable), into `output.txt`.

## Features

- **Recursive File Processing:** Traverses directories and extracts file contents.
- **Git Integration:** Fetches previously committed content of files from a Git repository.
- **Flexible Paths:** Supports base and forge paths configurable via `.env`.
- **Input/Output Handling:** Reads file paths from `input.txt` and writes results to `output.txt`.
- **Enhanced Logging:** Provides detailed logs, including warnings for empty or excluded files.

---

## Prerequisites

1. **Node.js**  
   Ensure you have Node.js installed. (Recommended version: `22.x`)

2. **Environment Variables**  
   Create a `.env` file in the project directory with the following variables:

   ```env
   BASE_PATH=C:/Path/To/Your/Base/Directory
   FORGE_PATH=C:/Path/To/Your/Forge/Directory
   AUTO_CHECK=true
   ```

3. **Git Repository**  
   The `BASE_PATH` should point to a valid Git repository for Git-based functionality.

---

## Installation

1. Clone the repository or copy the script:

   ```bash
   git clone https://github.com/<your-repo>/process-files.git
   cd process-files
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Configure the `.env` file as described above.

---

## Usage

### 1. Prepare Input File

Create an `input.txt` file in the `FORGE_PATH` directory and list the file or directory paths to process:

```txt
src
@forge assets/file.css
```

- Paths starting with `@forge` will be resolved relative to the `FORGE_PATH`.
- Other paths will be resolved relative to the `BASE_PATH`.

### 2. Run the Script

Execute the script with the following command:

```bash
node processFiles.js
```

### 3. Output

Results will be saved in `output.txt` in the `FORGE_PATH` directory.

---

## Debugging

The script includes detailed debug messages. Use these logs to troubleshoot issues:

- `[DEBUG]` messages provide insights into path resolution, file reading, and Git operations.
- Errors are logged with detailed context for easier debugging.

---

## Example Workflow

### Input (`input.txt`)

```txt
src
@forge assets/file.css
```

### Output (`output.txt`)

```txt
START
---
----> [file.js]:

- const x = 10;
- console.log(x);

----> [Previous Committed - file.js]:

- const x = 5;
- console.log(x);

---
END
```

---

## Dependencies

- [fs-extra](https://www.npmjs.com/package/fs-extra): File system utilities.
- [dotenv](https://www.npmjs.com/package/dotenv): Environment variable management.
- [simple-git](https://www.npmjs.com/package/simple-git): Git integration.
- [path](https://nodejs.org/api/path.html): Path utilities.

---

## License

This project is licensed under the MIT License. See the `LICENSE` file for details.

---

## Author

Built with ❤️ by AEZG.
