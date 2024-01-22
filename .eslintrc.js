module.exports = {
  env: {
    node: true
  },
  plugins: [
    '@typescript-eslint',
  ],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
  ],
  parserOptions: {
    project: ['./**/tsconfig.json'],
  },
};
