import { createImplementation } from "@webiny/di";
import { GlobalCliOption, GlobalOptionsRegistryService } from "~/abstractions/index.js";

export class DefaultGlobalOptionsRegistryService implements GlobalOptionsRegistryService.Interface {
    constructor(private globalOptions: GlobalCliOption.Interface[]) {}

    execute() {
        return this.globalOptions;
    }
}

export const globalOptionsRegistryService = createImplementation({
    abstraction: GlobalOptionsRegistryService,
    implementation: DefaultGlobalOptionsRegistryService,
    dependencies: [[GlobalCliOption, { multiple: true }]]
});
