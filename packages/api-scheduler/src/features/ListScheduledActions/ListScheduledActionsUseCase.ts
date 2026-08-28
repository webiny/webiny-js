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
import { SchedulerPermissionsResolver } from "~/features/permissions/abstractions.js";
import { IdentityContext } from "@webiny/api-core/exports/api/security.js";
import { ScheduledActionMapper } from "~/domain/ScheduledActionMapper.js";

class ListScheduledActionsUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        private listEntriesUseCase: ListLatestEntriesUseCase.Interface,
        private model: ScheduledActionModel.Interface,
        private cmsWhereMapper: CmsWhereMapper.Interface,
        private cmsSortMapper: CmsSortMapper.Interface,
        private permissionsResolver: SchedulerPermissionsResolver.Interface,
        private identityContext: IdentityContext.Interface
    ) {}

    async execute<T extends GenericRecord>(
        params: IListScheduledActionsParams
    ): Promise<Result<IListScheduledActionsResponse<T>, UseCaseAbstraction.Error>> {
        const namespace = params.where?.namespace || params.where?.namespace_startsWith;
        const permissions = namespace
            ? this.permissionsResolver.forNamespace(namespace)
            : undefined;

        if (permissions) {
            const hasPermission = await permissions.canRead();
            if (!hasPermission) {
                return Result.fail(new NotAuthorizedError());
            }
        }

        const ownRecordsOnly = permissions ? await permissions.onlyOwnRecords() : false;

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
        SchedulerPermissionsResolver,
        IdentityContext
    ]
});
