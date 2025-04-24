module.exports = {
  // Specify the parser
  parser: '@typescript-eslint/parser',
  // Specify the plugin
  plugins: [
    '@typescript-eslint',
  ],
  // Extend existing configurations
  extends: [
    'plugin:@typescript-eslint/recommended', // Add recommended TypeScript rules
    'next/core-web-vitals',
  ],
  // Add any custom rules or overrides here if needed
  rules: {
    // You might keep your custom rule if needed, 
    // but let's rely on the recommended set for now.
    // "@typescript-eslint/no-unused-vars": ["error", { "argsIgnorePattern": "^_", "varsIgnorePattern": "^_", "caughtErrorsIgnorePattern": "^_" }],
    
    // It's possible the error rule is too strict, you can adjust if needed:
    // e.g., disable it if necessary for specific reasons:
    // '@typescript-eslint/no-explicit-any': 'off',
  }
}; 