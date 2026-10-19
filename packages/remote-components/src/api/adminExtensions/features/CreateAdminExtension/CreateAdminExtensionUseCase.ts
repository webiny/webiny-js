import { Result } from "@webiny/feature/api";
import { CreateAdminExtensionUseCase as UseCaseAbstraction } from "./abstractions.js";
import { CreateAdminExtensionRepository } from "./abstractions.js";
import { CreateAdminExtensionInputSchema } from "./schema.js";
import { ListAdminExtensionsRepository } from "~/api/adminExtensions/features/ListAdminExtensions/abstractions.js";
import { AdminExtensionSourceValidator } from "~/api/adminExtensions/features/AdminExtensionSourceValidator/abstractions.js";
import { AdminExtensionPermissions } from "~/api/adminExtensions/features/AdminExtensionPermissions/abstractions.js";
import { AdminExtensionAlreadyExistsError } from "~/api/adminExtensions/domain/errors.js";
import { AdminExtensionNotAuthorizedError } from "~/api/adminExtensions/domain/errors.js";
import { AdminExtensionValidationError } from "~/api/adminExtensions/domain/errors.js";
import { ADMIN_EXTENSION_RUNTIME_VERSION } from "~/shared/adminExtensions/constants.js";
import type { AdminExtension } from "~/api/adminExtensions/domain/AdminExtension.js";
import type { AdminExtensionValues } from "~/api/adminExtensions/domain/AdminExtension.js";

class CreateAdminExtensionUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        private readonly permissions: AdminExtensionPermissions.Interface,
        private readonly listRepository: ListAdminExtensionsRepository.Interface,
        private readonly repository: CreateAdminExtensionRepository.Interface,
        private readonly validators: AdminExtensionSourceValidator.Interface[] = []
    ) {}

    async execute(
        input: UseCaseAbstraction.Input
    ): Promise<Result<AdminExtension, UseCaseAbstraction.Error>> {
        if (!(await this.permissions.canCreate("adminExtension"))) {
            return Result.fail(new AdminExtensionNotAuthorizedError());
        }

        const parsed = CreateAdminExtensionInputSchema.safeParse(input);
        if (!parsed.success) {
            return Result.fail(new AdminExtensionValidationError(parsed.error));
        }

        const { kind, name } = parsed.data;

        const validator = this.validators.find(candidate => candidate.kind === kind);
        if (!validator) {
            return Result.fail(
                new AdminExtensionValidationError(
                    `Admin extensions of kind "${kind}" are not supported yet.`
                )
            );
        }

        const source = validator.validate(parsed.data.source);
        if (source.isFail()) {
            return Result.fail(source.error);
        }

        const existing = await this.listRepository.execute({ kind, name });
        if (existing.isFail()) {
            return Result.fail(existing.error);
        }
        if (existing.value.length > 0) {
            return Result.fail(new AdminExtensionAlreadyExistsError(kind, name));
        }

        const values: AdminExtensionValues = {
            kind,
            name,
            label: parsed.data.label,
            description: parsed.data.description ?? "",
            enabled: true,
            runtimeVersion: ADMIN_EXTENSION_RUNTIME_VERSION,
            source: source.value
        };

        return this.repository.execute(values);
    }
}

export const CreateAdminExtensionUseCase = UseCaseAbstraction.createImplementation({
    implementation: CreateAdminExtensionUseCaseImpl,
    dependencies: [
        AdminExtensionPermissions,
        ListAdminExtensionsRepository,
        CreateAdminExtensionRepository,
        [AdminExtensionSourceValidator, { multiple: true, optional: true }]
    ]
});
