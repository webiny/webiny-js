import path from "path";
import fs from "fs-extra";
import yaml from "js-yaml";
import { findUpSync } from "find-up";
import { GetProjectRootPath } from "./GetProjectRootPath.js";
import { CliParams } from "../types.js";
import chalk from "chalk";

const { yellow } = chalk;

export class SetupYarn {
    async execute(cliArgs: CliParams) {
        const yarnVersion = "4.14.1";
        const yarnFile = `yarn-${yarnVersion}.cjs`;
        const yarnPath = `.yarn`;
        const yarnReleasesPath = path.join(yarnPath, "releases");
        const yarnReleasesFilePath = path.join(yarnReleasesPath, yarnFile);

        const getProjectRootPath = new GetProjectRootPath();
        const projectRootPath = getProjectRootPath.execute(cliArgs);

        const { assignToYarnrc } = cliArgs;
        /**
         * We do not want to do the recursive directory creating as it might do something in parent directories which we do not want.
         */
        const yarnReleaseFullPath = path.join(projectRootPath, yarnReleasesPath);
        fs.ensureDirSync(yarnReleaseFullPath);

        const source = path.join(import.meta.dirname, "SetupYarn", path.join("binaries", yarnFile));
        if (!fs.existsSync(source)) {
            throw new Error(`No yarn binary source file: ${source}`);
        }

        const target = path.join(projectRootPath, yarnReleasesFilePath);
        fs.copyFileSync(source, target);

        // `.yarnrc.yml` file is created here.
        const yarnRcPath = path.join(projectRootPath, ".yarnrc.yml");

        let rawYarnRc = `yarnPath: ${yarnReleasesFilePath}`;
        if (fs.existsSync(yarnRcPath)) {
            rawYarnRc = fs.readFileSync(yarnRcPath, "utf-8");
        }

        const parsedYarnRc = yaml.load(rawYarnRc) as Record<string, any>;

        // Default settings are applied here. Currently, we only apply the `nodeLinker` param.
        parsedYarnRc.nodeLinker = "node-modules";

        /* Apply defaults from the example .yarnrc.yml template. */
        const exampleYarnRc = this.loadExampleYarnRc();
        if (exampleYarnRc) {
            Object.assign(parsedYarnRc, exampleYarnRc);
        }

        // Enables adding additional params into the `.yarnrc.yml` file.
        if (assignToYarnrc) {
            let parsedAssignToYarnRc;
            try {
                parsedAssignToYarnRc = JSON.parse(assignToYarnrc);
            } catch {
                console.log(yellow("Warning: could not parse provided --assign-to-yarnrc JSON."));
            }

            if (parsedAssignToYarnRc) {
                Object.assign(parsedYarnRc, parsedAssignToYarnRc);
            }
        }

        fs.writeFileSync(yarnRcPath, yaml.dump(parsedYarnRc));
    }

    private loadExampleYarnRc(): Record<string, any> | null {
        const packageJsonPath = findUpSync("package.json", { cwd: import.meta.dirname });
        if (!packageJsonPath) {
            console.log(yellow("Warning: could not locate package root for example .yarnrc.yml."));
            return null;
        }

        const packageRoot = path.dirname(packageJsonPath);
        const exampleYarnRcPath = path.join(
            packageRoot,
            "_templates",
            "base",
            "example.yarnrc.yml"
        );

        try {
            return yaml.load(fs.readFileSync(exampleYarnRcPath, "utf-8")) as Record<string, any>;
        } catch (err) {
            console.log(yellow("Warning: could not load example .yarnrc.yml template."));
            console.log(yellow(`  resolved path: ${exampleYarnRcPath}`));
            console.log(yellow(`  file exists: ${fs.existsSync(exampleYarnRcPath)}`));
            console.log(yellow(`  error: ${(err as Error).message}`));
            return null;
        }
    }
}
