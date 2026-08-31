import {
    type CodeFlp,
    FlpFactory,
    FlpsProvider,
    type GetCodePermissionsParams
} from "./abstractions.js";
import { CodeFlpPath } from "./CodeFlpPath.js";
import { CodeFlpTarget } from "./CodeFlpTarget.js";
import type { FolderPermission } from "~/flp/flp.types.js";

class FlpProviderImpl implements FlpsProvider.Interface {
    private cache: CodeFlp[] | undefined;

    constructor(private flpFactories: FlpFactory.Interface[]) {}

    async getPermissions({ type, path }: GetCodePermissionsParams): Promise<FolderPermission[]> {
        const flps = await this.getFlps();

        return flps
            .filter(flp => flp.type === type && CodeFlpPath.matches(flp.path, path))
            .flatMap<FolderPermission>(flp => {
                return flp.permissions.map(permission => CodeFlpTarget.resolve(permission));
            });
    }

    private async getFlps(): Promise<CodeFlp[]> {
        if (this.cache === undefined) {
            const results = await Promise.all(this.flpFactories.map(factory => factory.execute()));
            this.cache = results.flat();
        }

        return this.cache;
    }
}

export const FlpProvider = FlpsProvider.createImplementation({
    implementation: FlpProviderImpl,
    dependencies: [[FlpFactory, { multiple: true }]]
});
