module.exports = {
  presets: [
    [
      '@babel/preset-env',
      {
        targets: {
          node: 10,
        },
      },
    ],
  ],
  plugins: [
    [
      "babel-plugin-relative-path-import", {
        "paths": [
          { "rootPathPrefix": "@", "rootPathSuffix": "." }
        ]
      }
    ]
  ]
};
