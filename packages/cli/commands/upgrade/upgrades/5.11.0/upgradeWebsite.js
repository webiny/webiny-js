const FILES = {
    formBuilder: "apps/website/code/src/plugins/formBuilder.ts"
};

const upgradeFormBuilderImports = async (project, context) => {
    const { info } = context;
    const file = FILES.formBuilder;
    info(`Upgrading ${info.hl(file)}`);

    const source = project.getSourceFile(file);
    const text = source.getFullText();

    source.set({
        statements: text.replace(/\/\//g, "").replace(new RegExp(`\\b/site/\\b`, "g"), "/render/")
    });
};

module.exports = {
    upgradeFormBuilderImports,
    files: FILES
};
