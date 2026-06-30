import { Result } from "@webiny/feature/api";
import {
    DeleteVariantUseCase as UseCaseAbstraction,
    DeleteVariantRepository
} from "./abstractions.js";
import { WbPermissions } from "~/features/permissions/abstractions.js";
import { VariantNotAuthorizedError } from "~/domain/variant/errors.js";

class DeleteVariantUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        private permissions: WbPermissions.Interface,
        private repository: DeleteVariantRepository.Interface
    ) {}

    async execute(params: UseCaseAbstraction.Params): UseCaseAbstraction.Return {
        const hasPermission = await this.permissions.canDelete("variant");
        if (!hasPermission) {
            return Result.fail(new VariantNotAuthorizedError());
        }

        return this.repository.execute(params);
    }
}

export const DeleteVariantUseCase = UseCaseAbstraction.createImplementation({
    implementation: DeleteVariantUseCaseImpl,
    dependencies: [WbPermissions, DeleteVariantRepository]
});
