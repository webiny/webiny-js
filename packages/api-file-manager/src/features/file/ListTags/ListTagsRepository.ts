import { Result } from "@webiny/feature/api";
import { GetUniqueFieldValuesUseCase } from "@webiny/api-headless-cms/features/contentEntry/GetUniqueFieldValues";
import { IdentityContext } from "@webiny/api-core/features/IdentityContext";
import { ListTagsRepository as RepositoryAbstraction, ListTagsInput, TagItem } from "./abstractions.js";
import { FileModel } from "~/domain/file/abstractions.js";
import { FilePersistenceError } from "~/domain/file/errors.js";

class ListTagsRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(
        private getUniqueFieldValues: GetUniqueFieldValuesUseCase.Interface,
        private fileModel: FileModel.Interface,
        private identityContext: IdentityContext.Interface
    ) {}

    async execute(input: ListTagsInput): Promise<Result<TagItem[], RepositoryAbstraction.Error>> {
        const result = await this.identityContext.withoutAuthorization(async () => {
            return await this.getUniqueFieldValues.execute(this.fileModel, {
                fieldId: "tags",
                where: {
                    ...(input.where || {}),
                    latest: true
                }
            });
        });

        if (result.isFail()) {
            return Result.fail(new FilePersistenceError(result.error));
        }

        // Map to TagItem format
        const tags: TagItem[] = result.value
            .map(uv => ({
                tag: uv.value as string,
                count: uv.count
            }))
            // Sort by tag name alphabetically
            .sort((a, b) => (a.tag < b.tag ? -1 : 1))
            // Then sort by count descending (most used first)
            .sort((a, b) => (a.count > b.count ? -1 : 1));

        return Result.ok(tags);
    }
}

export const ListTagsRepository = RepositoryAbstraction.createImplementation({
    implementation: ListTagsRepositoryImpl,
    dependencies: [GetUniqueFieldValuesUseCase, FileModel, IdentityContext]
});
