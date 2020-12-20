module.exports = {
  "env": {
    "es2020": true,
    "node": true,
    "jest": true
  },
  "parserOptions": {
    "sourceType": "module"
  },
  rules: {
    'no-console': process.env.NODE_ENV === 'production' ? 'error' : 'off',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'off',
    'padded-blocks': 'off',
    'object-curly-spacing': 'off',
    'max-len': ["error", { "code": 120 }],
    'arrow-body-style': ["error", "as-needed"],
    "no-warning-comments": [0, { "location": "anywhere" }],
    'arrow-parens': ["error", "as-needed"],
    'no-empty': ["error", { "allowEmptyCatch": true }],
  }
}
