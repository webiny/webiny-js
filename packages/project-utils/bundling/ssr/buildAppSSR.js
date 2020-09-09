const path = require("path");
const fs = require("fs-extra");

module.exports.buildAppSSR = async (
    { app = null, indexHtmlPath = null, createAppPath = null, output, ...options },
    context
) => {
    if (!app) {
        throw new Error(`Specify an "app" path to use for SSR bundle.`);
    }

    const { setupOutput } = require("./utils");
    output = setupOutput(output);

    process.env.NODE_ENV = "production";
    process.env.REACT_APP_ENV = "ssr";

    indexHtmlPath = indexHtmlPath || path.resolve(app, "build", "index.html");
    createAppPath = createAppPath || path.resolve(app, "src", "App");

    const indexHtml = indexHtmlPath.replace(/\\/g, "\\\\");
    const appComponent = createAppPath.replace(/\\/g, "\\\\");

    const chalk = require("chalk");

    if (!fs.existsSync(indexHtml)) {
        console.log(
            `\n🚨 ${chalk.red(
                indexHtml
            )} does not exist!\nHave you built the app before running the SSR build?\n`
        );
        process.exit(1);
    }

    // Build SSR
    const buildDir = path.resolve(output.path);
    await fs.emptyDir(buildDir);

    // Generate SSR boilerplate code
    const entry = path.resolve(output.path, "source.js");
    const handler = path.resolve(output.path, "handler.js");
    let code = await fs.readFile(__dirname + "/template/renderer.js", "utf8");
    const importApp = `import createApp from "${appComponent}";`;
    code = code.replace("/*{import-app-component}*/", importApp);
    code = code.replace("/*{index-html-path}*/", indexHtml);
    await fs.writeFile(entry, code);
    await fs.copyFile(__dirname + "/template/handler.js", handler);

    // Run bundling
    const { bundle } = require("./bundle");
    await bundle({ entry, output, ...options });

    // Delete the temporary source file
    await fs.unlink(entry);
};
