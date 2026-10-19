import { Result } from "@webiny/feature/api";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { CreateAdminExtensionUseCase as UseCaseAbstraction } from "./abstractions.js";
import { CreateAdminExtensionRepository } from "./abstractions.js";
import { CreateAdminExtensionInputSchema } from "./schema.js";
import { ListAdminExtensionsRepository } from "~/api/adminExtensions/features/ListAdminExtensions/abstractions.js";
import { AdminExtensionSourcePreparer } from "~/api/adminExtensions/features/AdminExtensionSourcePreparer/abstractions.js";
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
        private readonly identityContext: IdentityContext.Interface,
        private readonly listRepository: ListAdminExtensionsRepository.Interface,
        private readonly repository: CreateAdminExtensionRepository.Interface,
        private readonly preparers: AdminExtensionSourcePreparer.Interface[] = []
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

        const preparer = this.preparers.find(candidate => candidate.kind === kind);
        if (!preparer) {
            return Result.fail(
                new AdminExtensionValidationError(
                    `Admin extensions of kind "${kind}" are not supported yet.`
                )
            );
        }

        if (preparer.runsCode && !(await this.identityContext.hasFullAccess())) {
            return Result.fail(
                new AdminExtensionNotAuthorizedError(
                    "Only an identity with full access can create admin extensions that run code."
                )
            );
        }

        const prepared = await preparer.prepare({
            source: parsed.data.source,
            config: parsed.data.config ?? ""
        });
        if (prepared.isFail()) {
            return Result.fail(prepared.error);
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
            source: prepared.value.source,
            config: prepared.value.config,
            compiled: prepared.value.compiled
        };

        return this.repository.execute(values);
    }
}

export const CreateAdminExtensionUseCase = UseCaseAbstraction.createImplementation({
    implementation: CreateAdminExtensionUseCaseImpl,
    dependencies: [
        AdminExtensionPermissions,
        IdentityContext,
        ListAdminExtensionsRepository,
        CreateAdminExtensionRepository,
        [AdminExtensionSourcePreparer, { multiple: true, optional: true }]
    ]
});
