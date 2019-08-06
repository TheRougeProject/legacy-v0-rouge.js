module.exports = {
  parser: "babel-eslint",
  extends: "standard",
  env: {
    node: true
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
    'no-async-promise-executor' : 'off'
  }
}
