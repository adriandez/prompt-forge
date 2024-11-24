import prettier from 'eslint-plugin-prettier';

export default [
  {
    // Target JavaScript files
    files: ['**/*.js'],

    // Ignore specific files and directories
    ignores: ['**/node_modules/**', 'cypress/reports/', '**/*.min.js'],

    // Define language options
    languageOptions: {
      ecmaVersion: 2021, // Use ECMAScript 2021
      sourceType: 'module', // Enable ES Modules
      globals: {
        browser: 'readonly',
        es2021: true,
        node: 'readonly',
        mocha: 'readonly'
      }
    },

    // Configure plugins
    plugins: {
      prettier // Integrate Prettier as a plugin
    },

    // ESLint rules
    rules: {
      // Disable conflicting ESLint rules
      indent: 'off', // Turn off ESLint's indent rule

      // Prettier rule to handle formatting
      'prettier/prettier': [
        'error',
        {
          tabWidth: 2, // Use 2 spaces for indentation
          singleQuote: true, // Use single quotes
          trailingComma: 'none', // No trailing commas
          semi: true // Use semicolons
        }
      ],

      // Other linting rules
      semi: ['error', 'always'], // Enforce semicolons
      quotes: ['error', 'single'], // Enforce single quotes
      'comma-dangle': ['error', 'never'] // Disallow trailing commas
    }
  }
];
