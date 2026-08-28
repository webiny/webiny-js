import { Result } from "@webiny/feature/api";
import { CmsWhereMapper } from "@webiny/api-headless-cms";
import { ListLatestEntriesUseCase } from "@webiny/api-headless-cms/features/contentEntry/ListEntries/index.js";
import {
    CollabThreadMapper,
    CollabThreadModel,
    type ICollabThreadValues
} from "~/domain/thread/abstractions.js";
import { CollabThreadPersistenceError } from "~/domain/thread/errors.js";
import { ListThreadsRepository as Repository } from "./abstractions.js";

class ListThreadsRepositoryImpl implements Repository.Interface {
    constructor(
        private listLatestEntries: ListLatestEntriesUseCase.Interface,
        private model: CollabThreadModel.Interface,
        private mapper: CollabThreadMapper.Interface,
        private cmsWhereMapper: CmsWhereMapper.Interface
    ) {}

    async execute(params: Repository.Params): Repository.Return {
        // Exclude soft-deleted threads at the query level (not in JS afterwards), so `limit` and
        // the returned `meta` describe the same set the caller sees — otherwise a page made up of
        // soft-deleted rows would return 0 items while `meta` still reports more to load.
        const where = this.cmsWhereMapper.map({
            input: { ...params.where, deleted: false },
            fields: this.model.fields
        });

        const sort = (params.sort ?? ["createdOn_DESC"]) as (`${string}_ASC` | `${string}_DESC`)[];

        const listResult = await this.listLatestEntries.execute<ICollabThreadValues>(this.model, {
            sort,
            limit: params.limit ?? 100,
            after: params.after ?? undefined,
            where
        });

        if (listResult.isFail()) {
            return Result.fail(new CollabThreadPersistenceError(listResult.error));
        }

        const { entries, meta } = listResult.value;

        return Result.ok({
            items: entries.map(entry => this.mapper.fromCmsEntry(entry)),
            meta
        });
    }
}

export const ListThreadsRepository = Repository.createImplementation({
    implementation: ListThreadsRepositoryImpl,
    dependencies: [ListLatestEntriesUseCase, CollabThreadModel, CollabThreadMapper, CmsWhereMapper]
});
