import { createBuildPackage, createWatchPackage } from "@webiny/project-utils";

export default {
    commands: {
        build: createBuildPackage({ cwd: __dirname }),
        watch: createWatchPackage({ cwd: __dirname })
    }
};
