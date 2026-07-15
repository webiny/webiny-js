import { Result } from "@webiny/feature/api";
import { GetTargetScheduledActionUseCase } from "./abstractions.js";
import { ScheduledActionModel } from "../../shared/abstractions.js";
import { NotAuthorizedError, ScheduledActionNotFoundError, ScheduledActionPersistenceError } from "../../domain/errors.js";
import { GetEntryByIdUseCase } from "@webiny/api-headless-cms/features/contentEntry/GetEntryById/index.js";
import { SchedulerPermissions } from "../permissions/abstractions.js";
import { IdentityContext } from "@webiny/api-core/exports/api/security.js";
import { ScheduledActionMapper } from "../../domain/ScheduledActionMapper.js";
import { ScheduledActionId } from "../../domain/ScheduledActionId.js";
import { ScheduledActionIdWithVersion } from "../../domain/ScheduledActionIdWithVersion.js";
import { SCHEDULED_ACTION_PUBLISH, SCHEDULED_ACTION_UNPUBLISH } from "../../constants.js";
class GetTargetScheduledActionUseCaseImpl {
    constructor(getEntryByIdUseCase, model, permissions, identityContext){
        this.getEntryByIdUseCase = getEntryByIdUseCase;
        this.model = model;
        this.permissions = permissions;
        this.identityContext = identityContext;
    }
    async execute(params) {
        const hasPermission = await this.permissions.canRead("action");
        if (!hasPermission) return Result.fail(new NotAuthorizedError());
        const { id, namespace } = params;
        const entryResult = await this.getRecord(params);
        if (entryResult.isFail()) {
            if ("Cms/Entry/NotFound" === entryResult.error.code) return Result.fail(new ScheduledActionNotFoundError(id));
            return Result.fail(new ScheduledActionPersistenceError(entryResult.error));
        }
        const ownRecordsOnly = await this.permissions.onlyOwnRecords("action");
        if (ownRecordsOnly) {
            if (entryResult.value.createdBy.id !== this.identityContext.getIdentity().id) return Result.fail(new NotAuthorizedError());
        }
        const entry = entryResult.value;
        if (entry.values.namespace !== namespace) return Result.fail(new ScheduledActionNotFoundError(id));
        const action = ScheduledActionMapper.toAction(entry);
        return Result.ok(action);
    }
    async getRecord(params) {
        const schedulePublishId = ScheduledActionId.from({
            namespace: params.namespace,
            targetId: params.id,
            actionType: SCHEDULED_ACTION_PUBLISH
        });
        const publishResult = await this.getEntryByIdUseCase.execute(this.model, ScheduledActionIdWithVersion.from(schedulePublishId));
        if (publishResult.isOk()) return publishResult;
        const scheduleUnpublishId = ScheduledActionId.from({
            namespace: params.namespace,
            targetId: params.id,
            actionType: SCHEDULED_ACTION_UNPUBLISH
        });
        return this.getEntryByIdUseCase.execute(this.model, ScheduledActionIdWithVersion.from(scheduleUnpublishId));
    }
}
const GetTargetScheduledActionUseCase_GetTargetScheduledActionUseCase = GetTargetScheduledActionUseCase.createImplementation({
    implementation: GetTargetScheduledActionUseCaseImpl,
    dependencies: [
        GetEntryByIdUseCase,
        ScheduledActionModel,
        SchedulerPermissions,
        IdentityContext
    ]
});
export { GetTargetScheduledActionUseCase_GetTargetScheduledActionUseCase as GetTargetScheduledActionUseCase };

//# sourceMappingURL=GetTargetScheduledActionUseCase.js.map