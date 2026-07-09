import { createImplementation } from "@webiny/di";
import { DefaultAppsService } from "~/abstractions/index.js";

export class EmptyDefaultAppsService implements DefaultAppsService.Interface {
    async execute(): Promise<string[]> {
        return [];
    }
}

export const defaultAppsService = createImplementation({
    abstraction: DefaultAppsService,
    implementation: EmptyDefaultAppsService,
    dependencies: []
});
