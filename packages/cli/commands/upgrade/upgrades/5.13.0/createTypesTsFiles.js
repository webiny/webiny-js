const fs = require("fs");
const path = require("path");

const createTypesTsFiles = async context => {
    const { info, project, version } = context;

    const { addPackagesToDependencies } = require("../utils");

    info(`Creating new ${info.hl("types.ts")} files...`);

    {
        const src = path.join(__dirname, "files", "types", "graphql.ts");
        const destFolder = path.join(project.root, "api", "code", "graphql", "src");
        const dest = path.join(destFolder, "types.ts");

        if (fs.existsSync(destFolder)) {
            fs.copyFileSync(src, dest);
            info(`${info.hl(dest)} created.`);

            // These types.ts include additional packages. Let's add them to dependencies.
            const packageJsonFolder = path.join(project.root, "api", "code", "graphql");

            info(`Updating dependencies in ${info.hl(packageJsonFolder)}...`);

            if (fs.existsSync(packageJsonFolder)) {
                const packages = {
                    "@webiny/handler": version,
                    "@webiny/handler-http": version,
                    "@webiny/handler-args": version,
                    "@webiny/handler-client": version,
                    "@webiny/api-elasticsearch": version,
                    "@webiny/api-tenancy": version,
                    "@webiny/api-security": version,
                    "@webiny/api-i18n": version,
                    "@webiny/api-i18n-content": version,
                    "@webiny/api-page-builder": version,
                    "@webiny/api-prerendering-service": version,
                    "@webiny/api-file-manager": version,
                    "@webiny/api-form-builder": version
                };

                addPackagesToDependencies(packageJsonFolder, packages);
                info(`Dependencies in ${info.hl(packageJsonFolder)} successfully updated.`);
            } else {
                info(
                    `Could not update dependencies in ${info.hl(
                        packageJsonFolder
                    )} - file does not exist.`
                );
            }
        } else {
            info(`Could not create ${info.hl(dest)}, folder does not exist.`);
        }
    }

    {
        const src = path.join(__dirname, "files", "types", "headlessCMS.ts");
        const destFolder = path.join(project.root, "api", "code", "headlessCMS", "src");
        const dest = path.join(destFolder, "types.ts");

        if (fs.existsSync(destFolder)) {
            fs.copyFileSync(src, dest);
            info(`${info.hl(dest)} created.`);

            // These types.ts include additional packages. Let's add them to dependencies.
            const packageJsonFolder = path.join(project.root, "api", "code", "headlessCMS");

            info(`Updating dependencies in ${info.hl(packageJsonFolder)}...`);

            if (fs.existsSync(packageJsonFolder)) {
                const packages = {
                    "@webiny/handler": version,
                    "@webiny/handler-http": version,
                    "@webiny/handler-args": version,
                    "@webiny/handler-client": version,
                    "@webiny/api-elasticsearch": version,
                    "@webiny/api-security": version,
                    "@webiny/api-i18n": version,
                    "@webiny/api-i18n-content": version,
                    "@webiny/api-tenancy": version,
                    "@webiny/api-headless-cms": version
                };

                addPackagesToDependencies(packageJsonFolder, packages);
                info(`Dependencies in ${info.hl(packageJsonFolder)} successfully updated.`);
            } else {
                info(
                    `Could not update dependencies in ${info.hl(
                        packageJsonFolder
                    )} - file does not exist.`
                );
            }
        } else {
            info(`Could not create ${info.hl(dest)}, folder does not exist.`);
        }
    }
};

module.exports = {
    createTypesTsFiles
};
