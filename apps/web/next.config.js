const withTM = require("next-transpile-modules")(["moda-visualiser"]);

module.exports = withTM({
  reactStrictMode: true,
  webpack: (config, options) => {
    config.module.rules.push({
      test: /\.glsl/,
      type: "asset/source",
    })
    return config
  },
});
