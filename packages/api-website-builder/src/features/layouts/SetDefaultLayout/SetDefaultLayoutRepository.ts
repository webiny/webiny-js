import { Result } from "@webiny/feature/api";
import { KeyValueStore } from "@webiny/api-core/features/keyValueStore/index.js";
import { SetDefaultLayoutRepository as RepositoryAbstraction } from "./abstractions.js";
import { LayoutPersistenceError } from "~/domain/layout/errors.js";
import { WEBSITE_BUILDER_LAYOUT_SETTINGS } from "~/constants.js";

class SetDefaultLayoutRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(private keyValueStore: KeyValueStore.Interface) {}

    async execute(settings: RepositoryAbstraction.Settings): RepositoryAbstraction.Return {
        const result = await this.keyValueStore.set(WEBSITE_BUILDER_LAYOUT_SETTINGS, settings);
        if (result.isFail()) {
            return Result.fail(new LayoutPersistenceError(result.error));
        }

        return Result.ok(settings);
    }
}

export const SetDefaultLayoutRepository = RepositoryAbstraction.createImplementation({
    implementation: SetDefaultLayoutRepositoryImpl,
    dependencies: [KeyValueStore]
});
