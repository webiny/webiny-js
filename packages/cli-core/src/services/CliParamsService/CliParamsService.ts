import { createImplementation } from "@webiny/di";
import { CliParamsService } from "~/abstractions/index.js";

export class DefaultCliParamsService implements CliParamsService.Interface {
    params: CliParamsService.Params = {};

    get() {
        return this.params;
    }

    set(params: CliParamsService.Params) {
        this.params = {
            ...this.params,
            ...params
        };
    }
}

export const cliParamsService = createImplementation({
    abstraction: CliParamsService,
    implementation: DefaultCliParamsService,
    dependencies: []
});
