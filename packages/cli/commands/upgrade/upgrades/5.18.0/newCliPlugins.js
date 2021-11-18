const path = require("path");
const fs = require("fs");

const util = require("util");
const ncpBase = require("ncp");
const ncp = util.promisify(ncpBase.ncp);

module.exports = async context => {
    context.info(`Inserting new Admin Area and Website CLI plugins...`);
    console.log();

    const project = context.project;

    const src = path.join(__dirname, "newCliPlugins", "admin", "cli");
    const dest = path.join(project.root, "apps", "admin", "cli");
    context.info(`Inserting new CLI plugins into ${context.info.hl(dest)}.`);
    if (fs.existsSync(path.join(project.root, "apps", "admin"))) {
        await ncp(src, dest);
        context.success("CLI plugins successfully inserted.");
    } else {
        context.warning(
            `Skipping insertion of new CLI plugins into ${context.warning.hl(
                dest
            )}, it seems that the ${context.warning.hl(
                "Admin Area"
            )} project application doesn't exist.`
        );
    }
    console.log();

    const src2 = path.join(__dirname, "newCliPlugins", "website", "cli");
    const dest2 = path.join(project.root, "apps", "website", "cli");
    context.info(`Inserting new CLI plugins into ${context.info.hl(dest2)}.`);
    if (fs.existsSync(path.join(project.root, "apps", "website"))) {
        await ncp(src2, dest2);
        context.success("CLI plugins successfully inserted.");
    } else {
        context.warning(
            `Skipping insertion of new CLI plugins into ${context.warning.hl(
                dest2
            )}, it seems that the ${context.warning.hl(
                "Website"
            )} project application doesn't exist.`
        );
    }

    console.log();

    // Adjust root webiny.project.ts - update plugins.
    context.info(`Updating root ${context.info.hl(`webiny.project.ts`)} manifest file...`);

    const projectTsPath = path.join(project.root, "webiny.project.ts");
    if (fs.existsSync(projectTsPath)) {
        let content = fs.readFileSync(projectTsPath, "utf8");
        if (content.includes('import cliPageBuilder from "@webiny/api-page-builder/cli";')) {
            content = content.replace(
                'import cliPageBuilder from "@webiny/api-page-builder/cli";',
                `// Admin Area and Website CLI plugins.
import adminPlugins from "./apps/admin/cli";
import websitePlugins from "./apps/website/cli";`
            );

            content = content.replace(
                "cliPageBuilder()",
                `// Admin Area and Website CLI plugins.
            adminPlugins,
            websitePlugins`
            );

            fs.writeFileSync(projectTsPath, content);
            context.success(
                `Root ${context.success.hl(`webiny.project.ts`)} manifest file successfully updated.`
            );
        } else {
            context.warning(
                `Skipping update root ${context.info.hl(
                    `webiny.project.ts`
                )} manifest file. The code that was needed to be replaced does not exist.`
            );
        }
    } else {
        context.warning(
            `Skipping update root ${context.info.hl(
                `webiny.project.ts`
            )} manifest file. The file does not exist.`
        );
    }

    console.log();
};
