import { Result } from "@webiny/feature/api";
import {
    ListTagsUseCase as UseCaseAbstraction,
    ListTagsInput,
    TagItem,
    ListTagsRepository
} from "./abstractions.js";
import { FileNotAuthorizedError } from "~/domain/file/errors.js";
import { FmPermissions } from "~/features/shared/abstractions.js";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";

class ListTagsUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        private permissions: FmPermissions.Interface,
        private identityContext: IdentityContext.Interface,
        private repository: ListTagsRepository.Interface
    ) {}

    async execute(input: ListTagsInput): Promise<Result<TagItem[], UseCaseAbstraction.Error>> {
        // Security: tags expose file data, so they need the same read access as listFiles.
        const hasPermission = await this.permissions.canRead("file");
        if (!hasPermission) {
            return Result.fail(new FileNotAuthorizedError());
        }

        const where: ListTagsInput["where"] = {
            ...(input.where || {})
        };

        if (await this.permissions.onlyOwnRecords("file")) {
            where.createdBy = this.identityContext.getIdentity().id;
        }

        const enrichedInput: ListTagsInput = {
            ...input,
            where,
            limit: input.limit || 1000000
        };

        const result = await this.repository.execute(enrichedInput);

        if (result.isFail()) {
            return Result.fail(result.error);
        }

        return Result.ok(result.value);
    }
}

export const ListTagsUseCase = UseCaseAbstraction.createImplementation({
    implementation: ListTagsUseCaseImpl,
    dependencies: [FmPermissions, IdentityContext, ListTagsRepository]
});
