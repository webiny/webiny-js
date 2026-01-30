import { Result } from "@webiny/feature/api";
import { ListLatestEntriesUseCase } from "@webiny/api-headless-cms/features/contentEntry/ListEntries/abstractions.js";
import {
    IListScheduledActionsParams,
    IListScheduledActionsResponse,
    ListScheduledActionsUseCase as UseCaseAbstraction
} from "./abstractions.js";
import type { IScheduledAction } from "~/shared/abstractions.js";
import { ScheduledActionModel } from "~/shared/abstractions.js";
import { ScheduledActionPersistenceError } from "~/domain/errors.js";
import { CmsSortMapper, CmsWhereMapper } from "@webiny/api-headless-cms";
import type { GenericRecord } from "@webiny/api/types.js";

/**
 * Lists scheduled actions with optional filtering
 *
 * Flow:
 * 1. Build query filters based on where params (namespace, actionType, targetId, etc.)
 * 2. Fetch entries from CMS storage with pagination and sorting
 * 3. Transform CMS entries to IScheduledAction format
 * 4. Return paginated results with metadata
 */
class ListScheduledActionsUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        private listEntriesUseCase: ListLatestEntriesUseCase.Interface,
        private model: ScheduledActionModel.Interface,
        private cmsWhereMapper: CmsWhereMapper.Interface,
        private cmsSortMapper: CmsSortMapper.Interface
    ) {}

    async execute<T extends GenericRecord>(
        params: IListScheduledActionsParams
    ): Promise<Result<IListScheduledActionsResponse<T>, UseCaseAbstraction.Error>> {
        const { where, sort: sortInput, limit, after } = params;

        const sort = this.cmsSortMapper.map({
            input: sortInput,
            fields: this.model.fields
        });
        // List entries from CMS
        const listResult = await this.listEntriesUseCase.execute<IScheduledAction<T>>(this.model, {
            where: this.cmsWhereMapper.map({
                input: where,
                fields: this.model.fields
            }),
            sort,
            limit,
            after
        });

        if (listResult.isFail()) {
            return Result.fail(new ScheduledActionPersistenceError(listResult.error));
        }

        const { entries, meta } = listResult.value;

        // Transform entries to IScheduledAction format
        const scheduledActions: IScheduledAction<T>[] = entries.map(entry => {
            return {
                id: entry.entryId,
                title: entry.values.title,
                namespace: entry.values.namespace,
                actionType: entry.values.actionType,
                targetId: entry.values.targetId,
                scheduledBy: entry.values.scheduledBy,
                scheduledFor: entry.values.scheduledFor,
                payload: entry.values.payload,
                error: entry.values.error
            };
        });

        return Result.ok({
            items: scheduledActions,
            meta
        });
    }
}

export const ListScheduledActionsUseCase = UseCaseAbstraction.createImplementation({
    implementation: ListScheduledActionsUseCaseImpl,
    dependencies: [ListLatestEntriesUseCase, ScheduledActionModel, CmsWhereMapper, CmsSortMapper]
});
