import { Result } from "@webiny/feature/api";
import {
    GetVariantByIdUseCase as UseCaseAbstraction,
    GetVariantByIdRepository
} from "./abstractions.js";
import { WbPermissions } from "~/features/permissions/abstractions.js";
import { VariantNotAuthorizedError } from "~/domain/variant/errors.js";

class GetVariantByIdUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        private permissions: WbPermissions.Interface,
        private repository: GetVariantByIdRepository.Interface
    ) {}

    async execute(id: string): UseCaseAbstraction.Return {
        const hasPermission = await this.permissions.canRead("variant");
        if (!hasPermission) {
            return Result.fail(new VariantNotAuthorizedError());
        }

        return this.repository.execute(id);
    }
}

export const GetVariantByIdUseCase = UseCaseAbstraction.createImplementation({
    implementation: GetVariantByIdUseCaseImpl,
    dependencies: [WbPermissions, GetVariantByIdRepository]
});
