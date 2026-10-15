import { Result } from "@webiny/feature/api";
import { Logger } from "@webiny/api-core/features/logger/index.js";
import zod from "zod";
import { FeatureFlags } from "@webiny/api-core/features/featureFlags/abstractions.js";
import { WorkflowsNotAuthorizedError } from "~/domain/permissions/errors.js";
import { WorkflowPersistenceError } from "~/domain/workflow/errors.js";
import type { WorkflowStepTypeInfo } from "~/domain/config/types.js";
import { AUTOMATION_STEP_TYPE, REVIEW_STEP_TYPE } from "~/domain/workflow/stepTypes.js";
import { StepTypeRegistryService } from "~/features/stepTypes/StepTypeRegistryService/index.js";
import { CurrentReviewViewer } from "~/features/identity/CurrentReviewViewer/index.js";
import { WorkflowsPermissions } from "~/features/permissions/WorkflowsPermissions/index.js";
import { ListWorkflowStepTypesUseCase as UseCase } from "./abstractions.js";

const FAILURE_MESSAGE = "Could not list the step types.";
const FAILURE_LOG = "Could not list the workflow step types.";

class ListWorkflowStepTypesUseCaseImpl implements UseCase.Interface {
    constructor(
        private viewer: CurrentReviewViewer.Interface,
        private permissions: WorkflowsPermissions.Interface,
        private featureFlags: FeatureFlags.Interface,
        private stepTypes: StepTypeRegistryService.Interface,
        private logger: Logger.Interface
    ) {}

    async execute(): UseCase.Return {
        const actor = this.viewer.getActor();
        if (actor.isFail()) {
            return Result.fail(actor.error);
        }
        let canEdit: boolean;
        try {
            canEdit = await this.permissions.canEdit();
        } catch (error) {
            this.logger.error({ error }, FAILURE_LOG);
            return Result.fail(new WorkflowPersistenceError(new Error(FAILURE_MESSAGE)));
        }
        if (!canEdit) {
            return Result.fail(new WorkflowsNotAuthorizedError({ action: "list the step types" }));
        }

        // One row per registered type, by `type` (R138).
        const rowsByType = new Map<string, WorkflowStepTypeInfo>();
        try {
            for (const stepType of this.stepTypes.list()) {
                const availability = await stepType.describeAvailability();
                rowsByType.set(stepType.type, {
                    type: stepType.type,
                    title: stepType.title,
                    available: availability.available,
                    unavailableReason: availability.unavailableReason,
                    // Input side (what the author fills in); the surrounding try/catch turns a
                    // schema that cannot be converted into a persistence error (R87, R138).
                    configSchema: stepType.configSchema
                        ? zod.toJSONSchema(stepType.configSchema, {
                              io: "input",
                              unrepresentable: "any"
                          })
                        : null
                });
            }
        } catch (error) {
            this.logger.error({ error }, FAILURE_LOG);
            return Result.fail(new WorkflowPersistenceError(new Error(FAILURE_MESSAGE)));
        }

        // While no `ai` type is registered (phase 6 registers it), the row stays, as it was
        // before the registry: AI steps need the AI powerups entitlement (D130, R132).
        if (!rowsByType.has("ai")) {
            let aiAvailable: boolean;
            try {
                aiAvailable = this.featureFlags.get().isEnabled("aiPowerups");
            } catch (error) {
                this.logger.error({ error }, FAILURE_LOG);
                return Result.fail(new WorkflowPersistenceError(new Error(FAILURE_MESSAGE)));
            }
            rowsByType.set("ai", {
                type: "ai",
                title: "AI",
                available: aiAvailable,
                unavailableReason: aiAvailable ? null : "AI powerups are not enabled.",
                configSchema: null
            });
        }

        // Fixed display order first, then the other types in registration order (R138).
        const displayOrder = [REVIEW_STEP_TYPE, "ai", AUTOMATION_STEP_TYPE];
        const rows = [
            ...displayOrder
                .map(type => rowsByType.get(type))
                .filter((row): row is WorkflowStepTypeInfo => row !== undefined),
            ...[...rowsByType.values()].filter(row => !displayOrder.includes(row.type))
        ];
        return Result.ok(rows);
    }
}

export const ListWorkflowStepTypesUseCase = UseCase.createImplementation({
    implementation: ListWorkflowStepTypesUseCaseImpl,
    dependencies: [
        CurrentReviewViewer,
        WorkflowsPermissions,
        FeatureFlags,
        StepTypeRegistryService,
        Logger
    ]
});
