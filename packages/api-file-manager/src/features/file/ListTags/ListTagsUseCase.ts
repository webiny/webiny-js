import { Result } from "@webiny/feature/api";
import {
    ListTagsUseCase as UseCaseAbstraction,
    ListTagsInput,
    TagItem,
    ListTagsRepository
} from "./abstractions.js";
import { FileNotAuthorizedError } from "~/domain/file/errors.js";
import { FmPermissions } from "~/features/shared/abstractions.js";

class ListTagsUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        private permissions: FmPermissions.Interface,
        private repository: ListTagsRepository.Interface
    ) {}

    async execute(input: ListTagsInput): Promise<Result<TagItem[], UseCaseAbstraction.Error>> {
        const hasPermission = await this.permissions.canAccess("file");
        if (!hasPermission) {
            return Result.fail(new FileNotAuthorizedError());
        }

        const enrichedInput: ListTagsInput = {
            ...input,
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
    dependencies: [FmPermissions.Abstraction, ListTagsRepository]
});
