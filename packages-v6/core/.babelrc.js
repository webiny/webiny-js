const sharedPresets = ["@babel/typescript"];
const shared = {
  presets: sharedPresets,
};

module.exports = {
  env: {
    esmUnbundled: shared,
    cjs: {
      ...shared,
      presets: [
        [
          "@babel/env",
          {
            modules: "commonjs",
          },
        ],
        ...sharedPresets,
      ],
    },
  },
};
