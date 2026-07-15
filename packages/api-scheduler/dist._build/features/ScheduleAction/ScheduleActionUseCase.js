import { Result } from "@webiny/feature/api";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { CreateEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/CreateEntry/index.js";
import { UpdateEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/UpdateEntry/index.js";
import { DeleteEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/DeleteEntry/index.js";
import { parseIdentifier } from "@webiny/utils";
import { ScheduleActionUseCase } from "./abstractions.js";
import { GetScheduledActionUseCase } from "../GetScheduledAction/abstractions.js";
import { ScheduledActionModel, SchedulerService } from "../../shared/abstractions.js";
import { InvalidScheduleDateError, ScheduledActionPersistenceError, SchedulerServiceError } from "../../domain/errors.js";
import { ScheduledActionId } from "../../domain/ScheduledActionId.js";
import { ScheduledActionIdWithVersion } from "../../domain/ScheduledActionIdWithVersion.js";
import { isValidDate } from "../../domain/isValidDate.js";
import { NamespaceHandlerExecutioner } from "../NamespaceHandler/abstractions.js";
class ScheduleActionUseCaseImpl {
    constructor(identityContext, model, schedulerService, getScheduledAction, createEntryUseCase, updateEntryUseCase, deleteEntryUseCase, namespaceHandlerExecutioner){
        this.identityContext = identityContext;
        this.model = model;
        this.schedulerService = schedulerService;
        this.getScheduledAction = getScheduledAction;
        this.createEntryUseCase = createEntryUseCase;
        this.updateEntryUseCase = updateEntryUseCase;
        this.deleteEntryUseCase = deleteEntryUseCase;
        this.namespaceHandlerExecutioner = namespaceHandlerExecutioner;
    }
    async execute(params) {
        const identity = this.identityContext.getIdentity();
        let scheduleFor = params.scheduleFor;
        if (!params.immediately && !isValidDate(scheduleFor)) return Result.fail(new InvalidScheduleDateError(scheduleFor));
        if (params.immediately) scheduleFor = new Date(Date.now() + 90000);
        const actionId = ScheduledActionId.from({
            namespace: params.namespace,
            targetId: params.targetId,
            actionType: params.actionType
        });
        const scheduleId = ScheduledActionIdWithVersion.from(actionId);
        const existingResult = await this.getScheduledAction.execute({
            namespace: params.namespace,
            id: scheduleId
        });
        const namespaceHandlerResult = await this.namespaceHandlerExecutioner.execute({
            scheduleId: actionId,
            immediately: params.immediately,
            scheduleFor,
            targetId: params.targetId,
            actionType: params.actionType,
            namespace: params.namespace
        });
        if (namespaceHandlerResult.isFail()) return Result.fail(namespaceHandlerResult.error);
        const payload = namespaceHandlerResult.value;
        if (existingResult.isFail()) {
            const error = existingResult.error;
            if ("Scheduler/ScheduledAction/NotFound" === error.code) return this.createSchedule({
                scheduleId,
                title: payload.title,
                namespace: params.namespace,
                actionType: params.actionType,
                targetId: params.targetId,
                scheduleFor,
                identity,
                payload
            });
            if ("Scheduler/ScheduledAction/PersistenceError" === error.code) return Result.fail(error);
        }
        const scheduledAction = existingResult.value;
        return this.reschedule(scheduledAction, params.scheduleFor, identity, payload);
    }
    async createSchedule(params) {
        const { scheduleId: initialId, identity, payload, scheduleFor, actionType, targetId, title, namespace } = params;
        const { id: scheduleId } = parseIdentifier(initialId);
        const scheduledBy = {
            id: identity.id,
            type: identity.type,
            displayName: identity.displayName
        };
        const createResult = await this.createEntryUseCase.execute(this.model, {
            id: scheduleId,
            values: {
                scheduledFor: scheduleFor.toISOString(),
                scheduledBy,
                namespace,
                title,
                actionType,
                targetId,
                payload,
                error: void 0
            }
        });
        if (createResult.isFail()) return Result.fail(new ScheduledActionPersistenceError(new Error(createResult.error.message)));
        const scheduledAction = {
            id: scheduleId,
            tenant: createResult.value.tenant,
            title,
            namespace,
            actionType,
            targetId,
            scheduledBy,
            scheduledFor: scheduleFor,
            payload,
            error: void 0
        };
        try {
            await this.schedulerService.create({
                id: scheduleId,
                tenant: createResult.value.tenant,
                namespace,
                scheduleFor: new Date(scheduleFor)
            });
        } catch (error) {
            console.error(`Failed to create EventBridge schedule: ${scheduleId}. Rolling back...`);
            await this.deleteEntryUseCase.execute(this.model, scheduleId, {
                force: true,
                permanently: true
            });
            return Result.fail(new SchedulerServiceError(error));
        }
        return Result.ok(scheduledAction);
    }
    async reschedule(existing, scheduleFor, identity, payload) {
        if (!payload) payload = existing.payload;
        const existingEntryId = ScheduledActionIdWithVersion.from(existing.id);
        const updateResult = await this.updateEntryUseCase.execute(this.model, existingEntryId, {
            values: {
                scheduledBy: {
                    id: identity.id,
                    type: identity.type,
                    displayName: identity.displayName
                },
                scheduledFor: scheduleFor.toISOString(),
                payload
            }
        });
        if (updateResult.isFail()) return Result.fail(new ScheduledActionPersistenceError(new Error(updateResult.error.message)));
        try {
            await this.schedulerService.update({
                id: existing.id,
                tenant: existing.tenant,
                namespace: existing.namespace,
                scheduleFor: new Date(scheduleFor)
            });
        } catch (error) {
            return Result.fail(new SchedulerServiceError(error));
        }
        return Result.ok({
            ...existing,
            scheduledBy: {
                id: identity.id,
                type: identity.type,
                displayName: identity.displayName
            },
            scheduledFor: scheduleFor,
            payload
        });
    }
}
const ScheduleActionUseCase_ScheduleActionUseCase = ScheduleActionUseCase.createImplementation({
    implementation: ScheduleActionUseCaseImpl,
    dependencies: [
        IdentityContext,
        ScheduledActionModel,
        SchedulerService,
        GetScheduledActionUseCase,
        CreateEntryUseCase,
        UpdateEntryUseCase,
        DeleteEntryUseCase,
        NamespaceHandlerExecutioner
    ]
});
export { ScheduleActionUseCase_ScheduleActionUseCase as ScheduleActionUseCase };

//# sourceMappingURL=ScheduleActionUseCase.js.map