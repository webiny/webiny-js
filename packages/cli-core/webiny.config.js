import fs from "node:fs";
import path from "node:path";
import { createWatchPackage, createBuildPackage } from "@webiny/build-tools";

const dirname = import.meta.dirname;

export default {
    commands: {
        build: async options => {
            await createBuildPackage({ cwd: dirname })(options);
            // `references.json` lists the versions a project's dependencies should be on. The
            // upgrade tool (webiny-upgrades-v6) reads it from the installed package, so it has to
            // be published. Packages are published from `dist`.
            fs.cpSync(
                path.join(dirname, "files", "references.json"),
                path.join(dirname, "dist", "files", "references.json")
            );
        },
        watch: createWatchPackage({ cwd: dirname })
    }
};
