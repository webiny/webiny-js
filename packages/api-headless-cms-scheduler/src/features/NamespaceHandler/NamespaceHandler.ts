import {
    NamespaceHandler as NamespaceHandlerAbstraction,
    SchedulerNotAuthorizedError,
    ScheduledActionTypePublish
} from "@webiny/api-scheduler/exports/api/scheduler.js";
import { extractModelIdFromNamespace } from "~/utils/namespace.js";
import { Result } from "@webiny/feature/exports/api.js";
import { GetModelUseCase } from "@webiny/api-headless-cms/features/contentModel/GetModel/index.js";
import { GetEntryByIdUseCase } from "@webiny/api-headless-cms/features/contentEntry/GetEntryById/index.js";
import { AccessControl } from "@webiny/api-headless-cms/features/shared/abstractions.js";
import { ScheduleEntryGuard } from "~/features/ScheduleEntryGuard/index.js";
import { EntryValidationError } from "@webiny/api-headless-cms/domain/contentEntry/errors.js";
import {
    isPublishingEnabled,
    isSingletonModel
} from "@webiny/api-headless-cms/exports/api/cms/model.js";
import type { GenericRecord } from "@webiny/api/types.js";

class NamespaceHandlerImpl implements NamespaceHandlerAbstraction.Interface<GenericRecord> {
    public constructor(
        private getModelUseCase: GetModelUseCase.Interface,
        private getEntryByIdUseCase: GetEntryByIdUseCase.Interface,
        private accessControl: AccessControl.Interface,
        private scheduleEntryGuards: ScheduleEntryGuard.Interface[]
    ) {}

    public canHandle(namespace: string): boolean {
        const modelId = extractModelIdFromNamespace(namespace);

        return !!modelId;
    }

    public async execute(
        params: NamespaceHandlerAbstraction.Params
    ): NamespaceHandlerAbstraction.Response<GenericRecord> {
        /**
         * We know that modelId is ok because of the canHandle() method, which is always called before execute() and must return true for this handler to be executed.
         */
        const modelId = extractModelIdFromNamespace(params.namespace)!;
        // Fetch the target model
        const modelResult = await this.getModelUseCase.execute(modelId);
        if (modelResult.isFail()) {
            return Result.fail(modelResult.error as any);
        }

        const model = modelResult.value;
        // Private models are internal and cannot be scheduled.
        if (model.isPrivate) {
            return Result.fail(new SchedulerNotAuthorizedError());
        }

        // Cancelling stays possible for schedules that exist on a model without publishing.
        if (params.operation !== "cancel" && !isPublishingEnabled(model)) {
            return Result.fail(
                new EntryValidationError("Model does not support publishing.") as any
            );
        }

        // Fetch entry to get title
        const entryResult = await this.getEntryByIdUseCase.execute(model, params.targetId);
        if (entryResult.isFail()) {
            return Result.fail(entryResult.error as any);
        }

        const entry = entryResult.value;
        const pw = params.actionType === ScheduledActionTypePublish ? "p" : "u";
        // Same check as publishing / unpublishing the entry directly, including "own entries only".
        // Singleton entries are shared by everyone who can access the model, so the entry-level
        // (owner) check is skipped for them.
        const canSchedule = isSingletonModel(model)
            ? await this.accessControl.canAccessEntry({ model, pw })
            : await this.accessControl.canAccessEntry({ model, entry, pw });
        if (!canSchedule) {
            return Result.fail(new SchedulerNotAuthorizedError());
        }
        for (const guard of this.scheduleEntryGuards) {
            const allowed = await guard.canSchedule({
                model,
                entry,
                actionType: params.actionType
            });
            if (!allowed) {
                return Result.fail(new SchedulerNotAuthorizedError());
            }
        }
        const title = entry.values[model.titleFieldId] || "Unknown entry title";

        return Result.ok({
            namespace: params.namespace,
            title,
            modelId,
            actionType: params.actionType,
            targetId: params.targetId,
            scheduleId: params.scheduleId,
            immediately: params.immediately || false
        });
    }
}

export const NamespaceHandler = NamespaceHandlerAbstraction.createImplementation({
    implementation: NamespaceHandlerImpl,
    dependencies: [
        GetModelUseCase,
        GetEntryByIdUseCase,
        AccessControl,
        [ScheduleEntryGuard, { multiple: true }]
    ]
});
