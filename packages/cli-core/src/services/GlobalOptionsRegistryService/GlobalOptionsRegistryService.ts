import { createImplementation } from "@webiny/di";
import { GlobalOption, GlobalOptionsRegistryService } from "~/abstractions/index.js";

export class DefaultGlobalOptionsRegistryService
    implements GlobalOptionsRegistryService.Interface
{
    constructor(private globalOptions: GlobalOption.Interface[]) {}

    execute() {
        return this.globalOptions;
    }
}

export const globalOptionsRegistryService = createImplementation({
    abstraction: GlobalOptionsRegistryService,
    implementation: DefaultGlobalOptionsRegistryService,
    dependencies: [[GlobalOption, { multiple: true }]]
});

