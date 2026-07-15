import { Result } from "@webiny/feature/api";
import { ExecuteScheduledActionUseCase, ExecutionFailedError, HandlerNotFoundError } from "./abstractions.js";
import { GetScheduledActionUseCase } from "../GetScheduledAction/abstractions.js";
import { ScheduledActionHandler, ScheduledActionModel } from "../../shared/abstractions.js";
import { ScheduledActionNotFoundError, ScheduledActionPersistenceError } from "../../domain/errors.js";
import { DeleteEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/DeleteEntry/index.js";
import { UpdateEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/UpdateEntry/index.js";
import { ScheduledActionIdWithVersion } from "../../domain/ScheduledActionIdWithVersion.js";
import { AuthenticatedIdentity, IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
class ExecuteScheduledActionUseCaseImpl {
    constructor(getScheduledActionUseCase, actionHandler, deleteEntryUseCase, updateEntryUseCase, model, identityContext){
        this.getScheduledActionUseCase = getScheduledActionUseCase;
        this.actionHandler = actionHandler;
        this.deleteEntryUseCase = deleteEntryUseCase;
        this.updateEntryUseCase = updateEntryUseCase;
        this.model = model;
        this.identityContext = identityContext;
    }
    async execute(params) {
        return this.identityContext.withoutAuthorization(async ()=>this.executeAction(params));
    }
    async executeAction(params) {
        const { id } = params;
        const getResult = await this.getScheduledActionUseCase.execute(params);
        if (getResult.isFail()) {
            const error = getResult.error;
            if ("Scheduler/ScheduledAction/NotFound" === error.code) return Result.fail(new ScheduledActionNotFoundError(id));
            return Result.fail(error);
        }
        const scheduledAction = getResult.value;
        const scheduledBy = scheduledAction.scheduledBy;
        this.identityContext.setIdentity(new AuthenticatedIdentity({
            id: scheduledBy.id,
            type: scheduledBy.type,
            displayName: scheduledBy.displayName ?? "",
            context: {
                canAccessTenant: true
            }
        }));
        const scheduleId = ScheduledActionIdWithVersion.from(id);
        if (!this.actionHandler.canHandle(scheduledAction.namespace, scheduledAction.actionType)) {
            const error = new HandlerNotFoundError(scheduledAction.namespace, scheduledAction.actionType);
            await this.updateEntryUseCase.execute(this.model, scheduleId, {
                values: {
                    error: error.message
                }
            });
            return Result.fail(error);
        }
        try {
            await this.actionHandler.handle(scheduledAction);
            const deleteResult = await this.deleteEntryUseCase.execute(this.model, scheduleId, {
                force: true,
                permanently: true
            });
            if (deleteResult.isFail()) return Result.fail(new ScheduledActionPersistenceError(new Error(deleteResult.error.message)));
            return Result.ok();
        } catch (error) {
            const executionError = new ExecutionFailedError(`Failed to execute scheduled action: ${error.message}`, error);
            await this.updateEntryUseCase.execute(this.model, scheduleId, {
                values: {
                    error: executionError.message
                }
            });
            return Result.fail(executionError);
        }
    }
}
const ExecuteScheduledActionUseCase_ExecuteScheduledActionUseCase = ExecuteScheduledActionUseCase.createImplementation({
    implementation: ExecuteScheduledActionUseCaseImpl,
    dependencies: [
        GetScheduledActionUseCase,
        ScheduledActionHandler,
        DeleteEntryUseCase,
        UpdateEntryUseCase,
        ScheduledActionModel,
        IdentityContext
    ]
});
export { ExecuteScheduledActionUseCase_ExecuteScheduledActionUseCase as ExecuteScheduledActionUseCase };

//# sourceMappingURL=ExecuteScheduledActionUseCase.js.map