import { Result } from "@webiny/feature/api";
import {
    UpdateVariantUseCase as UseCaseAbstraction,
    UpdateVariantRepository
} from "./abstractions.js";
import { WbPermissions } from "~/features/permissions/abstractions.js";
import { VariantNotAuthorizedError } from "~/domain/variant/errors.js";

class UpdateVariantUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        private permissions: WbPermissions.Interface,
        private repository: UpdateVariantRepository.Interface
    ) {}

    async execute(params: UseCaseAbstraction.Params): UseCaseAbstraction.Return {
        const hasPermission = await this.permissions.canEdit("variant");
        if (!hasPermission) {
            return Result.fail(new VariantNotAuthorizedError());
        }

        return this.repository.execute(params);
    }
}

export const UpdateVariantUseCase = UseCaseAbstraction.createImplementation({
    implementation: UpdateVariantUseCaseImpl,
    dependencies: [WbPermissions, UpdateVariantRepository]
});
