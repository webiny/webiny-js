import { createBuildServer } from "@webiny/build-tools";

export default {
    commands: {
        build: createBuildServer({ cwd: import.meta.dirname })
    }
};
