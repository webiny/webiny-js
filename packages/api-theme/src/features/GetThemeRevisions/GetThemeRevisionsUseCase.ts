import { Result } from "@webiny/feature/api";
import {
    GetThemeRevisionsRepository,
    GetThemeRevisionsUseCase as UseCaseAbstraction
} from "./abstractions.js";
import { ThemePermissions } from "~/features/permissions/abstractions.js";
import { ThemeNotAuthorizedError } from "~/domain/theme/errors.js";

class GetThemeRevisionsUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        private permissions: ThemePermissions.Interface,
        private repository: GetThemeRevisionsRepository.Interface
    ) {}

    async execute(entryId: string): UseCaseAbstraction.Return {
        if (!(await this.permissions.canRead("theme"))) {
            return Result.fail(new ThemeNotAuthorizedError());
        }

        return this.repository.execute(entryId);
    }
}

export const GetThemeRevisionsUseCase = UseCaseAbstraction.createImplementation({
    implementation: GetThemeRevisionsUseCaseImpl,
    dependencies: [ThemePermissions, GetThemeRevisionsRepository]
});
