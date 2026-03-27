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
    // {
    //     prev: "example.prettierrc.ts",
    //     next: ".prettierrc.ts"
    // },
    // {
    //     prev: "example.prettierignore",
    //     next: ".prettierignore"
    // },
    // {
    //     prev: "example.eslint.config.js",
    //     next: "eslint.config.js"
    // },
    {
        prev: "template.package.json",
        next: "package.json"
    }
];

export class SetupBaseWebinyProject {
    execute(cliArgs: CliParams) {
        const getTemplatesFolderPath = new GetTemplatesFolderPath();
        const templatesFolderPath = getTemplatesFolderPath.execute();

        const baseTemplatePath = path.join(templatesFolderPath, "base");

        const getProjectRootPath = new GetProjectRootPath();
        const projectRootFolderPath = getProjectRootPath.execute(cliArgs);

        fs.copySync(baseTemplatePath, projectRootFolderPath);

        for (let i = 0; i < renames.length; i++) {
            fs.moveSync(
                path.join(projectRootFolderPath, renames[i].prev),
                path.join(projectRootFolderPath, renames[i].next),
                {
                    overwrite: true
                }
            );
        }
    }
}
