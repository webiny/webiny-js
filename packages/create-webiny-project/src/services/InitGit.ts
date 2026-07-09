import path from "path";
import fs from "fs-extra";
import { execaSync } from "execa";
import { CliParams } from "../types.js";
import { GetProjectRootPath } from "./GetProjectRootPath.js";

export class InitGit {
    execute(cliArgs: CliParams) {
        const getProjectRootPath = new GetProjectRootPath();
        const projectRootPath = getProjectRootPath.execute(cliArgs);

        execaSync("git", ["--version"]);
        execaSync("git", ["init"], { cwd: projectRootPath });
        fs.writeFileSync(path.join(projectRootPath, ".gitignore"), "node_modules/");
    }
}
