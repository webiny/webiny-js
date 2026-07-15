import { Result } from "@webiny/feature/api";
import { ListLatestEntriesUseCase } from "@webiny/api-headless-cms/features/contentEntry/ListEntries/abstractions.js";
import { ListScheduledActionsUseCase } from "./abstractions.js";
import { ScheduledActionModel } from "../../shared/abstractions.js";
import { NotAuthorizedError, ScheduledActionPersistenceError } from "../../domain/errors.js";
import { CmsSortMapper, CmsWhereMapper } from "@webiny/api-headless-cms";
import { SchedulerPermissions } from "../permissions/abstractions.js";
import { IdentityContext } from "@webiny/api-core/exports/api/security.js";
import { ScheduledActionMapper } from "../../domain/ScheduledActionMapper.js";
class ListScheduledActionsUseCaseImpl {
    constructor(listEntriesUseCase, model, cmsWhereMapper, cmsSortMapper, permissions, identityContext){
        this.listEntriesUseCase = listEntriesUseCase;
        this.model = model;
        this.cmsWhereMapper = cmsWhereMapper;
        this.cmsSortMapper = cmsSortMapper;
        this.permissions = permissions;
        this.identityContext = identityContext;
    }
    async execute(params) {
        const hasPermission = await this.permissions.canRead("action");
        if (!hasPermission) return Result.fail(new NotAuthorizedError());
        const ownRecordsOnly = await this.permissions.onlyOwnRecords("action");
        const { where: initialWhere, sort: sortInput, limit, after } = params;
        const where = this.cmsWhereMapper.map({
            input: initialWhere || {},
            fields: this.model.fields
        });
        if (ownRecordsOnly) {
            const identity = this.identityContext.getIdentity();
            where.createdBy = identity.id;
        }
        const sort = this.cmsSortMapper.map({
            input: sortInput,
            fields: this.model.fields
        });
        const listResult = await this.listEntriesUseCase.execute(this.model, {
            where,
            sort,
            limit,
            after
        });
        if (listResult.isFail()) return Result.fail(new ScheduledActionPersistenceError(listResult.error));
        const { entries, meta } = listResult.value;
        return Result.ok({
            items: ScheduledActionMapper.toActions(entries),
            meta
        });
    }
}
const ListScheduledActionsUseCase_ListScheduledActionsUseCase = ListScheduledActionsUseCase.createImplementation({
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
export { ListScheduledActionsUseCase_ListScheduledActionsUseCase as ListScheduledActionsUseCase };

//# sourceMappingURL=ListScheduledActionsUseCase.js.map