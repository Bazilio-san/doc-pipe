module.exports = {
  root: true,
  parserOptions: {
    // project: true,
    // tsconfigRootDir: __dirname,
    // ecmaVersion: 2021, // Allows for the parsing of modern ECMAScript features
    // sourceType: 'module', // Allows for the use of imports
  },
  env: {
    jest: true,
  },
  // Rules order is important, please avoid shuffling them
  extends: [
    'eslint-config-af-24',
  ],
  plugins: [],
  ignorePatterns: ['node_modules/', '**/*.json', '**/@dist/**/*.*'],
  globals: {},
  rules: {
    'no-param-reassign': 'off',
    'no-await-in-loop': 'off',
    "prefer-destructuring": ["error", {"object": true, "array": false}]
  },
};