import { createImplementation } from "@webiny/di";
import { DefaultAppsService } from "@webiny/cli-core/abstractions/index.js";

export class ServerDefaultAppsService implements DefaultAppsService.Interface {
    async execute(): Promise<string[]> {
        return ["api", "admin"];
    }
}

export const serverDefaultAppsService = createImplementation({
    abstraction: DefaultAppsService,
    implementation: ServerDefaultAppsService,
    dependencies: []
});
