import { watchPackage, buildPackage } from "@webiny/project-utils";

export default {
    commands: {
        build: buildPackage,
        watch: watchPackage
    }
};
