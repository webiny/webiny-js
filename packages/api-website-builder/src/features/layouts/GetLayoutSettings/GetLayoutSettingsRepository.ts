import { Result } from "@webiny/feature/api";
import { KeyValueStore } from "@webiny/api-core/features/keyValueStore/index.js";
import { GetLayoutSettingsRepository as RepositoryAbstraction } from "./abstractions.js";
import { LayoutPersistenceError } from "~/domain/layout/errors.js";
import type { LayoutSettings } from "~/domain/layout/layoutSettings.js";
import { WEBSITE_BUILDER_LAYOUT_SETTINGS } from "~/constants.js";

class GetLayoutSettingsRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(private keyValueStore: KeyValueStore.Interface) {}

    async execute(): RepositoryAbstraction.Return {
        const result = await this.keyValueStore.get<Partial<LayoutSettings> | null>(
            WEBSITE_BUILDER_LAYOUT_SETTINGS
        );

        if (result.isFail()) {
            if (result.error.code === "KeyValueStore/KeyNotFound") {
                return Result.ok({ defaultLayout: null });
            }
            return Result.fail(new LayoutPersistenceError(result.error));
        }

        const defaultLayout = result.value?.defaultLayout;

        return Result.ok({
            defaultLayout: typeof defaultLayout === "string" && defaultLayout ? defaultLayout : null
        });
    }
}

export const GetLayoutSettingsRepository = RepositoryAbstraction.createImplementation({
    implementation: GetLayoutSettingsRepositoryImpl,
    dependencies: [KeyValueStore]
});
