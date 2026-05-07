import { createBuildAdmin } from "@webiny/build-tools";

export default {
    commands: {
        build: createBuildAdmin({ cwd: import.meta.dirname })
    }
};
