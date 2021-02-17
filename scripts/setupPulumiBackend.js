const fs = require("fs");
const path = require("path");
const yaml = require("js-yaml");
const { green } = require("chalk");
const argv = require("yargs").argv;
const trimEnd = require("lodash/trimEnd");

const DEFAULT_BACKEND_URL = "file://";

/**
 * Used within GitHub actions workflows (CI/CD).
 */
(async () => {
    const pulumiYamlFolders = ["api", "apps/admin", "apps/website"];
    const [backendUrl] = argv._;

    if (!backendUrl) {
        throw new Error('Please specify backend URL, e.g. "file://".');
    }

    for (let i = 0; i < pulumiYamlFolders.length; i++) {
        const pulumiYamlFolder = pulumiYamlFolders[i];
        const pulumiYamlPath = path.join(pulumiYamlFolder, "Pulumi.yaml");
        const parsedYaml = yaml.load(fs.readFileSync(pulumiYamlPath, "utf-8"));

        parsedYaml.backend.url = backendUrl;
        if (backendUrl !== DEFAULT_BACKEND_URL) {
            parsedYaml.backend.url = trimEnd(parsedYaml.backend.url);
            parsedYaml.backend.url += "/" + pulumiYamlFolder;
        }

        fs.writeFileSync(pulumiYamlPath, yaml.dump(parsedYaml));
        console.log(
            `${green(pulumiYamlPath)} updated: ${green("backend.url")} set to ${green(
                parsedYaml.backend.url
            )}.`
        );
    }
})();
