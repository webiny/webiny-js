import { createBuildPackage, createWatchPackage } from "@webiny/build-tools";

const __dirname = import.meta.dirname;

export default {
    commands: {
        build: createBuildPackage({ cwd: __dirname }),
        watch: createWatchPackage({ cwd: __dirname })
    }
};
