import { Result } from "@webiny/feature/api";
import { DeleteAdminExtensionUseCase as UseCaseAbstraction } from "./abstractions.js";
import { DeleteAdminExtensionRepository } from "./abstractions.js";
import { DeleteAdminExtensionInputSchema } from "./schema.js";
import { AdminExtensionPermissions } from "~/api/adminExtensions/features/AdminExtensionPermissions/abstractions.js";
import { AdminExtensionNotAuthorizedError } from "~/api/adminExtensions/domain/errors.js";
import { AdminExtensionValidationError } from "~/api/adminExtensions/domain/errors.js";

class DeleteAdminExtensionUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        private readonly permissions: AdminExtensionPermissions.Interface,
        private readonly repository: DeleteAdminExtensionRepository.Interface
    ) {}

    async execute(id: string): Promise<Result<boolean, UseCaseAbstraction.Error>> {
        if (!(await this.permissions.canDelete("adminExtension"))) {
            return Result.fail(new AdminExtensionNotAuthorizedError());
        }

        const parsed = DeleteAdminExtensionInputSchema.safeParse({ id });
        if (!parsed.success) {
            return Result.fail(new AdminExtensionValidationError(parsed.error));
        }

        return this.repository.execute(parsed.data.id);
    }
}

export const DeleteAdminExtensionUseCase = UseCaseAbstraction.createImplementation({
    implementation: DeleteAdminExtensionUseCaseImpl,
    dependencies: [AdminExtensionPermissions, DeleteAdminExtensionRepository]
});
