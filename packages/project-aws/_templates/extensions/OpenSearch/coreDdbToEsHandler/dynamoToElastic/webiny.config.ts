import { createBuildFunction, createWatchFunction } from "@webiny/build-tools";

export default {
    commands: {
        build: createBuildFunction({ cwd: import.meta.dirname }),
        watch: createWatchFunction({ cwd: import.meta.dirname })
    }
};
