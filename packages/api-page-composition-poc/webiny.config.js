import { createWatchPackage, createBuildPackage } from "@webiny/build-tools";

export default {
    commands: {
        build: createBuildPackage({ cwd: import.meta.dirname }),
        watch: createWatchPackage({ cwd: import.meta.dirname })
    }
};
