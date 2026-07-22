import { randomUUID } from "node:crypto";
import fs from "fs-extra";
import path from "path";
import { GetProjectRootPath } from "../../../../services/GetProjectRootPath.js";
import { CliParams } from "../../../../types.js";
import { GetTemplatesFolderPath } from "../../../../services/GetTemplatesFolderPath.js";

export const renames = [
    {
        prev: "example.gitignore",
        next: ".gitignore"
    },
    {
        prev: "example.gitattributes",
        next: ".gitattributes"
    },
    {
        prev: "template.package.json",
        next: "package.json"
    }
    // {
    //     prev: "example.yarnrc.yml",
    //     next: ".yarnrc.yml"
    // }
];

export class SetupBaseWebinyProject {
    execute(cliArgs: CliParams) {
        const getTemplatesFolderPath = new GetTemplatesFolderPath();
        const templatesFolderPath = getTemplatesFolderPath.execute();

        const baseTemplatePath = path.join(templatesFolderPath, "base");

        const getProjectRootPath = new GetProjectRootPath();
        const projectRootFolderPath = getProjectRootPath.execute(cliArgs);

        fs.copySync(baseTemplatePath, projectRootFolderPath, {
            filter: src => {
                // We want to skip copying yarnrc.yml file as it is not required anymore.
                // The installation script now creates file with required settings.
                if (src.includes("example.yarnrc.yml")) {
                    return false;
                }
                return true;
            }
        });

        for (let i = 0; i < renames.length; i++) {
            fs.moveSync(
                path.join(projectRootFolderPath, renames[i].prev),
                path.join(projectRootFolderPath, renames[i].next),
                {
                    overwrite: true
                }
            );
        }

        // Anonymous per-project identifier used by telemetry to group CLI/admin
        // events at the install level. Tracked in git (not in .webiny/) so it
        // stays stable across machines collaborating on the same project.
        const pkgPath = path.join(projectRootFolderPath, "package.json");
        const pkg = fs.readJsonSync(pkgPath);
        pkg.webiny = { ...pkg.webiny, installationId: randomUUID() };
        fs.writeJsonSync(pkgPath, pkg, { spaces: 2 });
    }
}
