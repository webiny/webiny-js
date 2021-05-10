import { buildFunction } from "@webiny/api-file-manager/handlers/transform/bundle";
import { watchFunction } from "@webiny/project-utils";

export default {
    commands: {
        build: buildFunction,
        watch: watchFunction
    }
};
