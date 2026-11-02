import { Result } from "@webiny/feature/api";
import zod from "zod";
import { FeatureFlags } from "@webiny/api-core/features/featureFlags/abstractions.js";
import { WorkflowPersistenceError } from "~/domain/workflow/errors.js";
import type { WorkflowStepTypeInfo } from "~/domain/config/types.js";
import {
    AI_STEP_TYPE,
    AUTOMATION_STEP_TYPE,
    REVIEW_STEP_TYPE
} from "~/domain/workflow/stepTypes.js";
import { StepTypeRegistryService } from "~/features/stepTypes/StepTypeRegistryService/index.js";
import { WorkflowEditorAccess } from "~/features/permissions/WorkflowEditorAccess/index.js";
import { ListWorkflowStepTypesUseCase as UseCase } from "./abstractions.js";

class ListWorkflowStepTypesUseCaseImpl implements UseCase.Interface {
    constructor(
        private editorAccess: WorkflowEditorAccess.Interface,
        private featureFlags: FeatureFlags.Interface,
        private stepTypes: StepTypeRegistryService.Interface
    ) {}

    async execute(): UseCase.Return {
        const access = await this.editorAccess.check("list the step types");
        if (access.isFail()) {
            return Result.fail(access.error);
        }

        // One row per registered type, by `type` (R138).
        const rowsByType = new Map<string, WorkflowStepTypeInfo>();
        try {
            for (const stepType of this.stepTypes.list()) {
                // oxlint-disable-next-line no-await-in-loop -- in memory: each step type answers from its registry or the feature flags.
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
            const cause = error instanceof Error ? error : new Error(String(error));
            return Result.fail(new WorkflowPersistenceError(cause));
        }

        // While no `ai` type is registered (ai-powerups registers it only when `aiPowerups` and
        // `advancedPublishingWorkflow` are both on, R177), the row stays, as it was before the
        // registry: AI steps need the AI powerups entitlement (D130, R132, R166).
        if (!rowsByType.has(AI_STEP_TYPE)) {
            let aiAvailable: boolean;
            try {
                aiAvailable = this.featureFlags.get().isEnabled("aiPowerups");
            } catch (error) {
                const cause = error instanceof Error ? error : new Error(String(error));
                return Result.fail(new WorkflowPersistenceError(cause));
            }
            rowsByType.set(AI_STEP_TYPE, {
                type: AI_STEP_TYPE,
                title: "AI",
                available: aiAvailable,
                unavailableReason: aiAvailable ? null : "AI powerups are not enabled.",
                configSchema: null
            });
        }

        // Fixed display order first, then the other types in registration order (R138).
        const displayOrder = [REVIEW_STEP_TYPE, AI_STEP_TYPE, AUTOMATION_STEP_TYPE];
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
    dependencies: [WorkflowEditorAccess, FeatureFlags, StepTypeRegistryService]
});
