import { Result } from "@webiny/feature/api";
import { ListAdminExtensionsUseCase as UseCaseAbstraction } from "./abstractions.js";
import { ListAdminExtensionsRepository } from "./abstractions.js";
import { ListAdminExtensionsInputSchema } from "./schema.js";
import { AdminExtensionPermissions } from "~/api/adminExtensions/features/AdminExtensionPermissions/abstractions.js";
import { AdminExtensionNotAuthorizedError } from "~/api/adminExtensions/domain/errors.js";
import { AdminExtensionValidationError } from "~/api/adminExtensions/domain/errors.js";
import type { AdminExtension } from "~/api/adminExtensions/domain/AdminExtension.js";

class ListAdminExtensionsUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        private readonly permissions: AdminExtensionPermissions.Interface,
        private readonly repository: ListAdminExtensionsRepository.Interface
    ) {}

    async execute(
        input: UseCaseAbstraction.Input = {}
    ): Promise<Result<AdminExtension[], UseCaseAbstraction.Error>> {
        if (!(await this.permissions.canRead("adminExtension"))) {
            return Result.fail(new AdminExtensionNotAuthorizedError());
        }

        const parsed = ListAdminExtensionsInputSchema.safeParse(input);
        if (!parsed.success) {
            return Result.fail(new AdminExtensionValidationError(parsed.error));
        }

        return this.repository.execute(parsed.data);
    }
}

export const ListAdminExtensionsUseCase = UseCaseAbstraction.createImplementation({
    implementation: ListAdminExtensionsUseCaseImpl,
    dependencies: [AdminExtensionPermissions, ListAdminExtensionsRepository]
});
