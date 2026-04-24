import { Result } from "@webiny/feature/api";
import { ListLatestEntriesUseCase } from "@webiny/api-headless-cms/features/contentEntry/ListEntries/abstractions.js";
import {
    IListScheduledActionsParams,
    IListScheduledActionsResponse,
    ListScheduledActionsUseCase as UseCaseAbstraction
} from "./abstractions.js";
import type { IScheduledActionEntryValues } from "~/shared/abstractions.js";
import { ScheduledActionModel } from "~/shared/abstractions.js";
import { NotAuthorizedError, ScheduledActionPersistenceError } from "~/domain/errors.js";
import { CmsSortMapper, CmsWhereMapper } from "@webiny/api-headless-cms";
import type { GenericRecord } from "@webiny/api/types.js";
import { SchedulerPermissions } from "~/features/permissions/abstractions.js";
import { IdentityContext } from "@webiny/api-core/exports/api/security.js";
import { ScheduledActionMapper } from "~/domain/ScheduledActionMapper.js";

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
        const listResult = await this.listEntriesUseCase.execute<IScheduledActionEntryValues<T>>(
            this.model,
            {
                where,
                sort,
                limit,
                after
            }
        );

        if (listResult.isFail()) {
            return Result.fail(new ScheduledActionPersistenceError(listResult.error));
        }

        const { entries, meta } = listResult.value;

        return Result.ok({
            items: ScheduledActionMapper.toActions<T>(entries),
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
        SchedulerPermissions,
        IdentityContext
    ]
});
