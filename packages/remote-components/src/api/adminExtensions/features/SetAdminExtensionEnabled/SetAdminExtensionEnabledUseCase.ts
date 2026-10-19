import { Result } from "@webiny/feature/api";
import { SetAdminExtensionEnabledUseCase as UseCaseAbstraction } from "./abstractions.js";
import { SetAdminExtensionEnabledRepository } from "./abstractions.js";
import { SetAdminExtensionEnabledInputSchema } from "./schema.js";
import { AdminExtensionPermissions } from "~/api/adminExtensions/features/AdminExtensionPermissions/abstractions.js";
import { AdminExtensionNotAuthorizedError } from "~/api/adminExtensions/domain/errors.js";
import { AdminExtensionValidationError } from "~/api/adminExtensions/domain/errors.js";
import type { AdminExtension } from "~/api/adminExtensions/domain/AdminExtension.js";

class SetAdminExtensionEnabledUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        private readonly permissions: AdminExtensionPermissions.Interface,
        private readonly repository: SetAdminExtensionEnabledRepository.Interface
    ) {}

    async execute(
        input: UseCaseAbstraction.Input
    ): Promise<Result<AdminExtension, UseCaseAbstraction.Error>> {
        if (!(await this.permissions.canEdit("adminExtension"))) {
            return Result.fail(new AdminExtensionNotAuthorizedError());
        }

        const parsed = SetAdminExtensionEnabledInputSchema.safeParse(input);
        if (!parsed.success) {
            return Result.fail(new AdminExtensionValidationError(parsed.error));
        }

        return this.repository.execute(parsed.data);
    }
}

export const SetAdminExtensionEnabledUseCase = UseCaseAbstraction.createImplementation({
    implementation: SetAdminExtensionEnabledUseCaseImpl,
    dependencies: [AdminExtensionPermissions, SetAdminExtensionEnabledRepository]
});
