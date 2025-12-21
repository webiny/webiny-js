import { Result } from "@webiny/feature/api";
import { ListLatestEntriesUseCase } from "@webiny/api-headless-cms/features/contentEntry/ListEntries/abstractions.js";
import type { CmsEntryListWhere } from "@webiny/api-headless-cms/types/index.js";
import {
    ListScheduledActionsUseCase as UseCaseAbstraction,
    IListScheduledActionsParams,
    IListScheduledActionsResponse
} from "./abstractions.js";
import type { IScheduledAction } from "~/shared/abstractions.js";
import { ScheduledActionModel } from "~/shared/abstractions.js";
import { ScheduledActionPersistenceError } from "~/domain/errors.js";

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
        private model: ScheduledActionModel.Interface
    ) {}

    async execute(
        params: IListScheduledActionsParams
    ): Promise<Result<IListScheduledActionsResponse, UseCaseAbstraction.Error>> {
        const { where, sort, limit, after } = params;

        // List entries from CMS
        const listResult = await this.listEntriesUseCase.execute(this.model, {
            where: where as CmsEntryListWhere,
            sort,
            limit,
            after
        });

        if (listResult.isFail()) {
            return Result.fail(new ScheduledActionPersistenceError(listResult.error));
        }

        const [items, meta] = listResult.value;

        // Transform entries to IScheduledAction format
        const scheduledActions: IScheduledAction[] = items.map(entry => ({
            id: entry.entryId,
            title: entry.values.title,
            namespace: entry.values.namespace,
            actionType: entry.values.actionType,
            targetId: entry.values.targetId,
            scheduledBy: entry.values.scheduledBy,
            scheduledOn: entry.values.scheduledOn,
            payload: entry.values.payload,
            error: entry.values.error
        }));

        return Result.ok({
            items: scheduledActions,
            meta
        });
    }
}

export const ListScheduledActionsUseCase = UseCaseAbstraction.createImplementation({
    implementation: ListScheduledActionsUseCaseImpl,
    dependencies: [ListLatestEntriesUseCase, ScheduledActionModel]
});
