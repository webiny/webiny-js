import { createWatchPackage, createBuildPackage } from "@webiny/build-tools";
import fs from "fs";
import path from "path";

export default {
    commands: {
        build: async (options, context) => {
            await createBuildPackage({ cwd: import.meta.dirname })(options, context);
            const from = path.join(import.meta.dirname, "_templates");
            const to = path.join(import.meta.dirname, "dist/_templates");
            fs.cpSync(from, to, {
                recursive: true
            });
        },
        watch: createWatchPackage({ cwd: import.meta.dirname })
    }
};
