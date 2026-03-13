import { Result } from "@webiny/feature/api";
import { ListLatestEntriesUseCase } from "@webiny/api-headless-cms/features/contentEntry/ListEntries/abstractions.js";
import {
    IListScheduledActionsParams,
    IListScheduledActionsResponse,
    ListScheduledActionsUseCase as UseCaseAbstraction
} from "./abstractions.js";
import type { IScheduledAction } from "~/shared/abstractions.js";
import { ScheduledActionModel } from "~/shared/abstractions.js";
import { NotAuthorizedError, ScheduledActionPersistenceError } from "~/domain/errors.js";
import { CmsSortMapper, CmsWhereMapper } from "@webiny/api-headless-cms";
import type { GenericRecord } from "@webiny/api/types.js";
import { SchedulerPermissions } from "~/domain/permissions.js";
import { IdentityContext } from "@webiny/api-core/exports/api/security.js";

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
        private cmsSortMapper: CmsSortMapper.Interface,
        private permissions: SchedulerPermissions.Interface,
        private identityContext: IdentityContext.Interface
    ) {}

    async execute<T extends GenericRecord>(
        params: IListScheduledActionsParams
    ): Promise<Result<IListScheduledActionsResponse<T>, UseCaseAbstraction.Error>> {
        const hasPermission = await this.permissions.canRead("action");
        if (!hasPermission) {
            return Result.fail(new NotAuthorizedError());
        }

        const ownRecordsOnly = await this.permissions.onlyOwnRecords("action");

        const { where: initialWhere, sort: sortInput, limit, after } = params;

        const where = this.cmsWhereMapper.map({
            input: initialWhere || {},
            fields: this.model.fields
        });

        if (ownRecordsOnly) {
            const identity = this.identityContext.getIdentity();
            where!.createdBy = identity.id;
        }

        const sort = this.cmsSortMapper.map({
            input: sortInput,
            fields: this.model.fields
        });
        // List entries from CMS
        const listResult = await this.listEntriesUseCase.execute<IScheduledAction<T>>(this.model, {
            where,
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
    dependencies: [
        ListLatestEntriesUseCase,
        ScheduledActionModel,
        CmsWhereMapper,
        CmsSortMapper,
        SchedulerPermissions.Abstraction,
        IdentityContext
    ]
});
