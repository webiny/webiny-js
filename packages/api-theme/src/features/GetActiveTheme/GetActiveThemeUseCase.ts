import { Result } from "@webiny/feature/api";
import { GetActiveThemeUseCase as UseCaseAbstraction } from "./abstractions.js";
import { ActiveThemeStore } from "~/features/ActiveThemeStore/index.js";
import { GetThemeByIdRepository } from "~/features/GetThemeById/index.js";
import { ThemePermissions } from "~/features/permissions/abstractions.js";
import { ThemeNotAuthorizedError } from "~/domain/theme/errors.js";

class GetActiveThemeUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        private permissions: ThemePermissions.Interface,
        private activeThemeStore: ActiveThemeStore.Interface,
        private repository: GetThemeByIdRepository.Interface
    ) {}

    async execute(): UseCaseAbstraction.Return {
        if (!(await this.permissions.canRead("theme"))) {
            return Result.fail(new ThemeNotAuthorizedError());
        }

        const pointerResult = await this.activeThemeStore.get();
        if (pointerResult.isFail()) {
            return Result.fail(pointerResult.error);
        }

        const pointer = pointerResult.value;
        if (!pointer) {
            return Result.ok({ theme: null, pointer: null });
        }

        // Goes through the repository, not the read use case: authorization was already checked
        // above, and re-checking would be a second identical round trip.
        const found = await this.repository.execute(pointer.id);

        if (found.isFail()) {
            // A pointer to a version that no longer exists degrades to "no active theme" rather
            // than failing — a deleted revision must not take the site down.
            if (found.error.code === "Theme/NotFound") {
                return Result.ok({ theme: null, pointer });
            }
            return Result.fail(found.error);
        }

        return Result.ok({ theme: found.value, pointer });
    }
}

export const GetActiveThemeUseCase = UseCaseAbstraction.createImplementation({
    implementation: GetActiveThemeUseCaseImpl,
    dependencies: [ThemePermissions, ActiveThemeStore, GetThemeByIdRepository]
});
