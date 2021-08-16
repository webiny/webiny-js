const fs = require("fs");
const tsMorph = require("ts-morph");

const addNewScaffolds = async context => {
    const { info, project, version } = context;

    const { addPackagesToDependencies, createMorphProject, insertImport } = require("../utils");

    info(
        `Adding new scaffolds as ${info.hl("dependencies")} in ${info.hl("package.json")} file...`
    );

    addPackagesToDependencies(project.root, {
        "@webiny/cli-plugin-scaffold-graphql-api": version,
        "@webiny/cli-plugin-scaffold-react-app": version,
        "@webiny/cli-plugin-scaffold-full-stack-app": version
    });

    info(`Added new scaffolds as ${info.hl("dependencies")} in ${info.hl("package.json")} file.`);

    const webinyProjectTsPath = "webiny.project.ts";
    info(`Adding new scaffolds in the ${info.hl(webinyProjectTsPath)} file...`);
    if (!fs.existsSync(webinyProjectTsPath)) {
        info(`Skipping - could not find ${info.hl(webinyProjectTsPath)} file.`);
        return;
    }

    const graphQlProject = createMorphProject([webinyProjectTsPath]);
    const webinyProjectTs = graphQlProject.getSourceFileOrThrow(webinyProjectTsPath);
    info(`Adding new scaffolds to the ${webinyProjectTsPath} file...`);

    insertImport(
        webinyProjectTs,
        "cliScaffoldGraphQlApi",
        "@webiny/cli-plugin-scaffold-graphql-api"
    );

    insertImport(webinyProjectTs, "cliScaffoldReactApp", "@webiny/cli-plugin-scaffold-react-app");

    insertImport(
        webinyProjectTs,
        "cliScaffoldFullStackApp",
        "@webiny/cli-plugin-scaffold-full-stack-app"
    );

    webinyProjectTs.forEachDescendant((node, traversal) => {
        const kind = node.getKind();
        if (kind === tsMorph.SyntaxKind.ArrayLiteralExpression) {
            const parent = node.getParent();
            if (!parent.compilerNode || !parent.compilerNode.name) {
                traversal.skip();
                return;
            }
            const compilerNode = parent.compilerNode || {};
            const name = compilerNode.name || {};
            const escapedText = name.escapedText;
            if (escapedText !== "plugins") {
                traversal.skip();
                return;
            }
            node.addElement("cliScaffoldGraphQlApi()");
            node.addElement("cliScaffoldReactApp()");
            node.addElement("cliScaffoldFullStackApp()");
            traversal.stop();
        }
    });

    info(`New scaffolds added to the ${webinyProjectTsPath} file.`);

    await webinyProjectTs.save();
};

module.exports = {
    addNewScaffolds
};
