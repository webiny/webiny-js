const fs = require("fs");
const { green } = require("chalk");
const path = require("path");
const aliasTokensExport = require("./importFromFigma/exports/Alias tokens.json");
const { normalizeFigmaExport } = require("./importFromFigma/normalizeFigmaExport");
const {
    createTailwindConfigCustomizations
} = require("./importFromFigma/createTailwindConfigCustomizations");
const { createStylesScss } = require("./importFromFigma/createStylesScss");
const { formatCode } = require("./importFromFigma/formatCode");

const saveFileAndFormat = async (filePath, content) => {
    fs.writeFileSync(filePath, content);
    await formatCode(filePath);
};

(async () => {
    const normalizedFigmaExport = normalizeFigmaExport(aliasTokensExport);
    const tailwindConfigCustomizations = createTailwindConfigCustomizations(normalizedFigmaExport);
    const stylesScss = createStylesScss(normalizedFigmaExport);

    const paths = {
        cwd: process.cwd(),
        normalizedFigmaExport: path.join(__dirname, "../.normalizedFigmaExport.json"),
        tailwindConfigCustomizations: path.join(__dirname, "../tailwind.config.customizations.js"),
        stylesScss: path.join(__dirname, "../src/styles.scss")
    };

    console.log("Storing...");
    console.log(
        `‣ normalized Figma export (${green(
            path.relative(paths.cwd, paths.normalizedFigmaExport)
        )}).`
    );
    console.log(
        `‣ Tailwind config customizations (${green(
            path.relative(paths.cwd, paths.tailwindConfigCustomizations)
        )}).`
    );
    console.log(`‣ styles.scss (${green(path.relative(paths.cwd, paths.stylesScss))}).`);

    await saveFileAndFormat(
        paths.normalizedFigmaExport,
        JSON.stringify(normalizedFigmaExport, null, 2)
    );

    await saveFileAndFormat(
        paths.tailwindConfigCustomizations,
        `module.exports = ${JSON.stringify(tailwindConfigCustomizations, null, 2)};`
    );

    await saveFileAndFormat(paths.stylesScss, stylesScss);

    console.log("Done.");
})();
