import { buildFunction, watchFunction } from "@webiny/project-utils";

// Exports fundamental watch and build commands.
export default {
    commands: {
        watch: watchFunction,
        build: buildFunction
    }
};
