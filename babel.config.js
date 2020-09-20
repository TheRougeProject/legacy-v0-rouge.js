module.exports = {
  presets: [
    [
      '@babel/preset-env',
      {
        targets: {
          node: 'current',
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
