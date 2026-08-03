import { Result } from "@webiny/feature/api";
import { ListThemesRepository, ListThemesUseCase as UseCaseAbstraction } from "./abstractions.js";
import { ThemePermissions } from "~/features/permissions/abstractions.js";
import { ThemeNotAuthorizedError } from "~/domain/theme/errors.js";

class ListThemesUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        private permissions: ThemePermissions.Interface,
        private repository: ListThemesRepository.Interface
    ) {}

    async execute(params: UseCaseAbstraction.Params = {}): UseCaseAbstraction.Return {
        if (!(await this.permissions.canRead("theme"))) {
            return Result.fail(new ThemeNotAuthorizedError());
        }

        // No own-record filtering: the permission schema has no `own` scope, because a tenant must
        // always be able to see the theme its own site is running.
        return this.repository.execute(params);
    }
}

export const ListThemesUseCase = UseCaseAbstraction.createImplementation({
    implementation: ListThemesUseCaseImpl,
    dependencies: [ThemePermissions, ListThemesRepository]
});
