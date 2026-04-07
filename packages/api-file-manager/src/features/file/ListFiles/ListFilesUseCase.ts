import { Result } from "@webiny/feature/api";
import {
    ListFilesUseCase as UseCaseAbstraction,
    ListFilesInput,
    ListFilesOutput,
    ListFilesRepository
} from "./abstractions.js";
import { FileNotAuthorizedError } from "~/domain/file/errors.js";
import { FmPermissions } from "~/features/shared/abstractions.js";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";

class ListFilesUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        private permissions: FmPermissions.Interface,
        private identityContext: IdentityContext.Interface,
        private repository: ListFilesRepository.Interface
    ) {}

    async execute(
        input: ListFilesInput
    ): Promise<Result<ListFilesOutput, UseCaseAbstraction.Error>> {
        const hasPermission = await this.permissions.canRead("file");
        if (!hasPermission) {
            return Result.fail(new FileNotAuthorizedError());
        }

        // Build where clause.
        const where: ListFilesInput["where"] = {
            ...(input.where || {})
        };

        // Filter by createdBy if user can only access own records.
        if (await this.permissions.onlyOwnRecords("file")) {
            const identity = this.identityContext.getIdentity();
            where.createdBy = identity.id;
        }

        const result = await this.repository.execute({
            ...input,
            where,
            limit: input.limit || 40,
            sort: input.sort && input.sort.length > 0 ? input.sort : ["id_DESC"]
        });

        if (result.isFail()) {
            return Result.fail(result.error);
        }

        return Result.ok(result.value);
    }
}

export const ListFilesUseCase = UseCaseAbstraction.createImplementation({
    implementation: ListFilesUseCaseImpl,
    dependencies: [FmPermissions, IdentityContext, ListFilesRepository]
});
