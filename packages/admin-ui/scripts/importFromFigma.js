import fs from "fs";
import chalk from "chalk";
import path from "path";
import { normalizeFigmaExport } from "./importFromFigma/normalizeFigmaExport.js";
import { normalizePrimitivesFigmaExport } from "./importFromFigma/normalizePrimitivesFigmaExport.js";
import { createTailwindConfigTheme } from "./importFromFigma/createTailwindConfigTheme.js";
import { createThemeCssV4 } from "./importFromFigma/createThemeCssV4.js";
import { formatCode } from "./importFromFigma/formatCode.js";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const saveFileAndFormat = async (filePath, content) => {
    fs.writeFileSync(filePath, content);
    await formatCode(filePath);
};

(async () => {
    const normalizedFigmaExport = normalizeFigmaExport();
    const normalizedPrimitivesFigmaExport = normalizePrimitivesFigmaExport();
    const tailwindConfigTheme = createTailwindConfigTheme(normalizedFigmaExport);
    const themeCss = createThemeCssV4(normalizedFigmaExport, normalizedPrimitivesFigmaExport);

    const paths = {
        cwd: process.cwd(),
        normalizedFigmaExport: path.join(__dirname, "../.normalizedFigmaExport.json"),
        normalizedPrimitivesFigmaExport: path.join(
            __dirname,
            "../.normalizedPrimitivesFigmaExport.json"
        ),
        createTailwindConfigTheme: path.join(__dirname, "../tailwind.config.theme.js"),
        themeCss: path.join(__dirname, "../src/theme.css")
    };

    console.log("Storing...");
    console.log(
        `‣ normalized Figma export (${chalk.green(
            path.relative(paths.cwd, paths.normalizedFigmaExport)
        )}).`
    );
    console.log(
        `‣ Tailwind config theme (${chalk.green(
            path.relative(paths.cwd, paths.createTailwindConfigTheme)
        )}).`
    );
    console.log(`‣ theme.css (${chalk.green(path.relative(paths.cwd, paths.themeCss))}).`);

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
        `export default ${JSON.stringify(tailwindConfigTheme, null, 2)};`
    );

    await saveFileAndFormat(paths.themeCss, themeCss);

    console.log("Done.");
})();
