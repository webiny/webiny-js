const fs = require("fs");
const { green } = require("chalk");
const path = require("path");
const { normalizeFigmaExport } = require("./importFromFigma/normalizeFigmaExport");
const {
    normalizePrimitivesFigmaExport
} = require("./importFromFigma/normalizePrimitivesFigmaExport");
const { createTailwindConfigTheme } = require("./importFromFigma/createTailwindConfigTheme");
const { createThemeScss } = require("./importFromFigma/createThemeScss");
const { formatCode } = require("./importFromFigma/formatCode");

const saveFileAndFormat = async (filePath, content) => {
    fs.writeFileSync(filePath, content);
    await formatCode(filePath);
};

(async () => {
    const normalizedFigmaExport = normalizeFigmaExport();
    const normalizedPrimitivesFigmaExport = normalizePrimitivesFigmaExport();
    const tailwindConfigTheme = createTailwindConfigTheme(normalizedFigmaExport);
    const stylesScss = createThemeScss(normalizedFigmaExport, normalizedPrimitivesFigmaExport);

    const paths = {
        cwd: process.cwd(),
        normalizedFigmaExport: path.join(__dirname, "../.normalizedFigmaExport.json"),
        normalizedPrimitivesFigmaExport: path.join(
            __dirname,
            "../.normalizedPrimitivesFigmaExport.json"
        ),
        createTailwindConfigTheme: path.join(__dirname, "../tailwind.config.theme.js"),
        stylesScss: path.join(__dirname, "../src/theme.css")
    };

    console.log("Storing...");
    console.log(
        `‣ normalized Figma export (${green(
            path.relative(paths.cwd, paths.normalizedFigmaExport)
        )}).`
    );
    console.log(
        `‣ Tailwind config theme (${green(
            path.relative(paths.cwd, paths.createTailwindConfigTheme)
        )}).`
    );
    console.log(`‣ theme.css (${green(path.relative(paths.cwd, paths.stylesScss))}).`);

    await saveFileAndFormat(
        paths.normalizedFigmaExport,
        JSON.stringify(normalizedFigmaExport, null, 2)
    );

    await saveFileAndFormat(
        paths.normalizedPrimitivesFigmaExport,
        JSON.stringify(normalizedPrimitivesFigmaExport, null, 2)
    );

    await saveFileAndFormat(
        paths.createTailwindConfigTheme,
        `module.exports = ${JSON.stringify(tailwindConfigTheme, null, 2)};`
    );

    await saveFileAndFormat(paths.stylesScss, stylesScss);

    console.log("Done.");
})();
