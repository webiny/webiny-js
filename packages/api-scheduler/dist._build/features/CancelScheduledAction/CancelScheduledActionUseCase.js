import { Result } from "@webiny/feature/api";
import { CancelScheduledActionUseCase } from "./abstractions.js";
import { GetScheduledActionUseCase } from "../GetScheduledAction/abstractions.js";
import { ScheduledActionModel, SchedulerService } from "../../shared/abstractions.js";
import { NotAuthorizedError, ScheduledActionNotFoundError, ScheduledActionPersistenceError } from "../../domain/errors.js";
import { DeleteEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/DeleteEntry/index.js";
import { ScheduledActionIdWithVersion } from "../../domain/ScheduledActionIdWithVersion.js";
import { EntryNotFoundError } from "@webiny/api-headless-cms/domain/contentEntry/errors.js";
import { SchedulerPermissions } from "../permissions/abstractions.js";
class CancelScheduledActionUseCaseImpl {
    constructor(getScheduledActionUseCase, schedulerService, deleteEntryUseCase, model, permissions){
        this.getScheduledActionUseCase = getScheduledActionUseCase;
        this.schedulerService = schedulerService;
        this.deleteEntryUseCase = deleteEntryUseCase;
        this.model = model;
        this.permissions = permissions;
    }
    async execute(params) {
        const hasPermission = await this.permissions.canRead("action");
        if (!hasPermission) return Result.fail(new NotAuthorizedError());
        const { id } = params;
        const getResult = await this.getScheduledActionUseCase.execute(params);
        if (getResult.isFail()) {
            const error = getResult.error;
            if ("Scheduler/ScheduledAction/NotFound" === error.code) return Result.fail(new ScheduledActionNotFoundError(id));
            return Result.fail(error);
        }
        const scheduleId = ScheduledActionIdWithVersion.from(id);
        try {
            const eventBridgeSchedule = await this.schedulerService.exists(params);
            if (eventBridgeSchedule) await this.schedulerService.delete(params);
        } catch (error) {
            console.warn(`Failed to delete EventBridge schedule: ${scheduleId}, tenant "${params.tenant}". Continuing with CMS entry deletion.`, error);
        }
        const deleteResult = await this.deleteEntryUseCase.execute(this.model, getResult.value.id, {
            force: true,
            permanently: true
        });
        if (deleteResult.isFail()) {
            if (deleteResult.error instanceof EntryNotFoundError) return Result.ok(true);
            return Result.fail(new ScheduledActionPersistenceError(new Error(deleteResult.error.message)));
        }
        return Result.ok(true);
    }
}
const CancelScheduledActionUseCase_CancelScheduledActionUseCase = CancelScheduledActionUseCase.createImplementation({
    implementation: CancelScheduledActionUseCaseImpl,
    dependencies: [
        GetScheduledActionUseCase,
        SchedulerService,
        DeleteEntryUseCase,
        ScheduledActionModel,
        SchedulerPermissions
    ]
});
export { CancelScheduledActionUseCase_CancelScheduledActionUseCase as CancelScheduledActionUseCase };

//# sourceMappingURL=CancelScheduledActionUseCase.js.map