import { createImplementation } from "@webiny/di";
import { ProjectSdkParamsService } from "~/abstractions/index.js";

export class DefaultProjectSdkParamsService implements ProjectSdkParamsService.Interface {
    params: ProjectSdkParamsService.Params;

    constructor() {
        this.params = {
            cwd: "",
            extensions: [],
            logging: {
                streamToStdout: false,
                level: "info"
            }
        };
    }

    get() {
        return this.params;
    }

    set(params: ProjectSdkParamsService.Params) {
        this.params = {
            cwd: params.cwd || "",
            extensions: [...(params.extensions || [])],
            logging: {
                ...this.params.logging,
                ...params.logging
            }
        };
    }
}

export const projectSdkParamsService = createImplementation({
    abstraction: ProjectSdkParamsService,
    implementation: DefaultProjectSdkParamsService,
    dependencies: []
});
