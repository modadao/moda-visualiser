const withTM = require("next-transpile-modules")(["@coc-boilerplate/moda-visualiser"]);

module.exports = withTM({
  reactStrictMode: true,
  webpack: (config, options) => {
    config.module.rules.push({
      test: /\.glsl/,
      type: "asset/source",
    })
    config.module.rules.push({
      test: /\.mp3/,
      type: "asset/resource",
    })
    config.module.rules.push({
      test: /\.wav/,
      type: "asset/resource",
    })
    return config
  },
});
