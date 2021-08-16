const targetVersion = "5.13.0";

module.exports = {
    async canUpgrade(options, context) {
        if (context.version === targetVersion) {
            return true;
        } else if (
            context.version.match(
                new RegExp(
                    /**
                     * This is for beta testing.
                     */
                    `^${targetVersion}-`
                )
            )
        ) {
            return true;
        }
        throw new Error(
            `Upgrade must be on Webiny CLI version "${targetVersion}". Current CLI version is "${context.version}".`
        );
    },

    async upgrade(options, context) {
        const { createTypesTsFiles } = require("./createTypesTsFiles");
        const { addNewScaffolds } = require("./addNewScaffolds");
        const { addDotWebinyToGitIgnore } = require("./addDotWebinyToGitIgnore");

        await addDotWebinyToGitIgnore(context);
        await createTypesTsFiles(context);
        await addNewScaffolds(context);

        const { yarnInstall, prettierFormat } = require("../utils");

        await yarnInstall({ context });

        await prettierFormat(
            [
                "api/code/graphql/src/types.ts",
                "api/code/graphql/package.json",
                "api/code/headlessCMS/src/types.ts",
                "api/code/headlessCMS/package.json",
                "package.json",
                "webiny.project.ts"
            ],
            context
        );
    }
};
