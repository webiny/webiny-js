const { transform } = require("@babel/core");
const fs = require("fs-extra");
const path = require("path");
const prettier = require("prettier");

module.exports = async () => {
    const tmpDir = path.resolve("node_modules", ".webiny");
    const appIndex = path.relative(tmpDir, path.resolve("src", "index.js"));

    const source = await fs.readFile(__dirname + "/template/index.js", "utf8");
    const { code } = await transform(source, {
        plugins: [
            "@babel/plugin-syntax-jsx",
            [__dirname + "/transforms/injectApp", { appIndex }]
        ].filter(Boolean)
    });

    const indexJs = path.join(tmpDir, "index.js");
    await fs.ensureDir(tmpDir);
    await fs.writeFileSync(
        indexJs,
        prettier.format(code, { parser: "babel" })
    );

    return indexJs;
};
