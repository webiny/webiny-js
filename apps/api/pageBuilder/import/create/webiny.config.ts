import { createBuildFunction, createWatchFunction } from "@webiny/project-utils";

export default {
    commands: {
        build: createBuildFunction({ cwd: __dirname }),
        watch: createWatchFunction({ cwd: __dirname })
    }
};
