import { Result } from "@webiny/feature/api";
import { GetUniqueFieldValuesUseCase } from "@webiny/api-headless-cms/features/contentEntry/GetUniqueFieldValues";
import {
    ListTagsInput,
    ListTagsRepository as RepositoryAbstraction,
    TagItem
} from "./abstractions.js";
import { FileModelProvider } from "~/domain/file/abstractions.js";
import { FilePersistenceError } from "~/domain/file/errors.js";
import { CmsWhereMapper } from "@webiny/api-headless-cms";

const TAG_PREFIX_FILTERS = ["tags_startsWith", "tags_not_startsWith"];

class ListTagsRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(
        private getUniqueFieldValues: GetUniqueFieldValuesUseCase.Interface,
        private fileModelProvider: FileModelProvider.Interface,
        private cmsWhereMapper: CmsWhereMapper.Interface
    ) {}

    async execute(input: ListTagsInput): Promise<Result<TagItem[], RepositoryAbstraction.Error>> {
        const fileModel = await this.fileModelProvider.get();

        /*
         * Prefix conditions on the tags themselves select tags, not files: "tags not starting with
         * scope:" lists every other tag, including those of files that also have a scoped tag.
         * Other conditions (e.g. createdBy) still select the files whose tags are listed. Without
         * them the storage lists the tags of all files, which it can answer from maintained counts.
         */
        const filesWhere: Record<string, any> = {};
        const tagFilters: { key: string; prefix: string }[] = [];
        for (const [key, value] of Object.entries(input.where || {})) {
            if (TAG_PREFIX_FILTERS.includes(key)) {
                if (value !== undefined && value !== null && value !== "") {
                    tagFilters.push({ key, prefix: String(value).toLowerCase() });
                }
                continue;
            }
            filesWhere[key] = value;
        }

        const result = await this.getUniqueFieldValues.execute(fileModel, {
            fieldId: "tags",
            // TODO fix with proper types
            // @ts-expect-error
            where: this.cmsWhereMapper.map({
                input: {
                    ...filesWhere,
                    latest: true
                },
                fields: fileModel.fields
            })
        });

        if (result.isFail()) {
            return Result.fail(new FilePersistenceError(result.error));
        }

        // Map to TagItem format
        const tags: TagItem[] = result.value
            .filter(uv =>
                tagFilters.every(({ key, prefix }) => {
                    // Case-insensitive, as the startsWith filter.
                    const starts = String(uv.value).toLowerCase().startsWith(prefix);
                    return key === "tags_startsWith" ? starts : !starts;
                })
            )
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
    dependencies: [GetUniqueFieldValuesUseCase, FileModelProvider, CmsWhereMapper]
});
