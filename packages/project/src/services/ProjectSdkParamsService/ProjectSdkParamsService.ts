import { createImplementation } from "@webiny/di";
import { ProjectSdkParamsService } from "~/abstractions/index.js";

export class DefaultProjectSdkParamsService implements ProjectSdkParamsService.Interface {
    params: ProjectSdkParamsService.Params;

    constructor() {
        this.params = { cwd: "", extensions: [] };
    }

    get() {
        return this.params;
    }

    set(params: ProjectSdkParamsService.Params) {
        this.params = {
            extensions: [...(params.extensions || [])],
            cwd: params.cwd || ""
        };
    }
}

export const projectSdkParamsService = createImplementation({
    abstraction: ProjectSdkParamsService,
    implementation: DefaultProjectSdkParamsService,
    dependencies: []
});
