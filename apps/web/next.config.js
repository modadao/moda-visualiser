// const withTM = require("next-transpile-modules")(["@moda/moda-visualiser"]);

module.exports = {
  reactStrictMode: true,
  webpack: (config, options) => {
    // Only needed when importing @moda/moda-visualiser directly
    //
    // config.module.rules.push({
    //   test: /\.glsl/,
    //   type: "asset/source",
    // })
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
};
