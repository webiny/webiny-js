import { Result } from "@webiny/feature/api";
import { GetScheduledActionUseCase } from "./abstractions.js";
import { ScheduledActionModel } from "../../shared/abstractions.js";
import { NotAuthorizedError, ScheduledActionNotFoundError, ScheduledActionPersistenceError } from "../../domain/errors.js";
import { GetEntryByIdUseCase } from "@webiny/api-headless-cms/features/contentEntry/GetEntryById/index.js";
import { ScheduledActionIdWithVersion } from "../../domain/ScheduledActionIdWithVersion.js";
import { SchedulerPermissions } from "../permissions/abstractions.js";
import { IdentityContext } from "@webiny/api-core/exports/api/security.js";
import { ScheduledActionMapper } from "../../domain/ScheduledActionMapper.js";
class GetScheduledActionUseCaseImpl {
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
        const scheduleId = ScheduledActionIdWithVersion.from(id);
        const entryResult = await this.getEntryByIdUseCase.execute(this.model, scheduleId);
        if (entryResult.isFail()) {
            if ("Cms/Entry/NotFound" === entryResult.error.code) return Result.fail(new ScheduledActionNotFoundError(scheduleId));
            return Result.fail(new ScheduledActionPersistenceError(entryResult.error));
        }
        const ownRecordsOnly = await this.permissions.onlyOwnRecords("action");
        if (ownRecordsOnly) {
            if (entryResult.value.createdBy.id !== this.identityContext.getIdentity().id) return Result.fail(new NotAuthorizedError());
        }
        const entry = entryResult.value;
        if (entry.values.namespace !== namespace) return Result.fail(new ScheduledActionNotFoundError(scheduleId));
        const action = ScheduledActionMapper.toAction(entry);
        return Result.ok(action);
    }
}
const GetScheduledActionUseCase_GetScheduledActionUseCase = GetScheduledActionUseCase.createImplementation({
    implementation: GetScheduledActionUseCaseImpl,
    dependencies: [
        GetEntryByIdUseCase,
        ScheduledActionModel,
        SchedulerPermissions,
        IdentityContext
    ]
});
export { GetScheduledActionUseCase_GetScheduledActionUseCase as GetScheduledActionUseCase };

//# sourceMappingURL=GetScheduledActionUseCase.js.map