module.exports = {
  root: true,
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'plugin:react-native/all',
    'prettier',
  ],
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint', 'react', 'react-native'],
  parserOptions: {
    ecmaFeatures: {
      jsx: true,
    },
    ecmaVersion: 2021,
    sourceType: 'module',
  },
  env: {
    'react-native/react-native': true,
  },
  rules: {
    'react/prop-types': 'off', // Not needed with TypeScript
    'react/react-in-jsx-scope': 'off', // Not needed with React 17+
    'react-native/no-inline-styles': 'off', // Allow inline styles
    '@typescript-eslint/explicit-module-boundary-types': 'off', // Don't require explicit return types
    'react-hooks/exhaustive-deps': 'warn', // Warn about missing dependencies in useEffect
    'no-console': ['warn', { allow: ['warn', 'error'] }], // Allow console.warn and console.error
  },
  settings: {
    react: {
      version: 'detect',
    },
  },
};
