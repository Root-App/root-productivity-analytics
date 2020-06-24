module.exports = {
  env: {
    browser: true,
    commonjs: true,
    es2020: true,
    'jest/globals': true,
    es6: true,
  },
  extends: [
    'airbnb-base',
  ],
  parserOptions: {
    ecmaVersion: 11,
  },
  plugins: ['jest'],
  rules: {
    'no-underscore-dangle': 'off',
  },
  parser: 'babel-eslint',
};
