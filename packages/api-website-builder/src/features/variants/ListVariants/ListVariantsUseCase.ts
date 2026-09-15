import { Result } from "@webiny/feature/api";
import { ListVariantsUseCase as UseCaseAbstraction } from "./abstractions/ListVariantsUseCase.js";
import { ListVariantsRepository } from "./abstractions/ListVariantsRepository.js";
import { WbPermissions } from "~/features/permissions/abstractions.js";
import { VariantNotAuthorizedError } from "~/domain/variant/errors.js";

class ListVariantsUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        private permissions: WbPermissions.Interface,
        private repository: ListVariantsRepository.Interface
    ) {}

    async execute(params: UseCaseAbstraction.Params): UseCaseAbstraction.Return {
        const hasPermission = await this.permissions.canRead("page");
        if (!hasPermission) {
            return Result.fail(new VariantNotAuthorizedError());
        }

        return this.repository.execute(params);
    }
}

export const ListVariantsUseCase = UseCaseAbstraction.createImplementation({
    implementation: ListVariantsUseCaseImpl,
    dependencies: [WbPermissions, ListVariantsRepository]
});
