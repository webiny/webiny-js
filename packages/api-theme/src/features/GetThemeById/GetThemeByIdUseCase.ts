import { Result } from "@webiny/feature/api";
import {
    GetThemeByIdRepository,
    GetThemeByIdUseCase as UseCaseAbstraction
} from "./abstractions.js";
import { ThemePermissions } from "~/features/permissions/abstractions.js";
import { ThemeNotAuthorizedError } from "~/domain/theme/errors.js";

class GetThemeByIdUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        private permissions: ThemePermissions.Interface,
        private repository: GetThemeByIdRepository.Interface
    ) {}

    async execute(id: string): UseCaseAbstraction.Return {
        if (!(await this.permissions.canRead("theme"))) {
            return Result.fail(new ThemeNotAuthorizedError());
        }

        return this.repository.execute(id);
    }
}

export const GetThemeByIdUseCase = UseCaseAbstraction.createImplementation({
    implementation: GetThemeByIdUseCaseImpl,
    dependencies: [ThemePermissions, GetThemeByIdRepository]
});
