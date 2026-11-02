import zod from "zod";
import { Logger } from "@webiny/api-core/features/logger/index.js";
import { WorkflowBypassService } from "~/features/bypass/WorkflowBypassService/index.js";
import { ReviewTargetEditorService } from "~/features/review/ReviewTargetEditorService/index.js";
import { StepRunStaleCheckService } from "~/features/stepRun/StepRunStaleCheckService/index.js";
import { WorkflowAiTool } from "~/features/aiTools/WorkflowAiTool/abstractions.js";
import {
    AI_TOOL_NO_FIELDS_MESSAGE,
    AI_TOOL_STEP_CHECK_FAILED_MESSAGE,
    AI_TOOL_STEP_NOT_RUNNING_MESSAGE,
    UPDATE_TARGET_FIELDS_TOOL_NAME
} from "~/features/aiTools/constants.js";

const updateTargetFieldsInputSchema = zod.object({
    fields: zod.record(zod.string(), zod.unknown())
});

type UpdateTargetFieldsInput = zod.infer<typeof updateTargetFieldsInputSchema>;

/**
 * Built-in tool (R173): the only writer of the content under review. The target comes from the
 * review snapshot in the context, never from the model (Review Focus 2). Order: re-check that the
 * step still belongs to this task by re-reading the STORED review (a cancel, a delete or a restart
 * during the model call, Review Focus 1). The check is fail-closed: when it fails (the stored
 * review could not be read; the service already logged it) nothing is written. Then write through
 * the target editor inside the bypass, with the write awaited inside `run` (`AsyncLocalStorage`:
 * inactive the moment `update` returns or throws, never active for a save outside the tool, Review
 * Focus 4). Which paths may be written is the adapter's rule (R172); a refusal or a throw is a tool
 * answer and never fails the step. It holds no per-call state: the registry keeps one instance per
 * container.
 */
class UpdateTargetFieldsToolImpl implements WorkflowAiTool.Interface<UpdateTargetFieldsInput> {
    public readonly name = UPDATE_TARGET_FIELDS_TOOL_NAME;
    public readonly title = "Update target fields";
    public readonly description =
        "Changes fields of the content under review. Send fields as an object: each key is a field path returned by readTarget (only fields marked writable) and each value is the new value. Fields you do not list stay unchanged. The change is saved immediately; if any path is refused nothing is written and you get the reason.";
    public readonly label = "Update fields";
    public readonly summary = "Edits field values in the revision under review.";
    public readonly changesContent = true;
    public readonly inputSchema = updateTargetFieldsInputSchema;

    public constructor(
        private editors: ReviewTargetEditorService.Interface,
        private staleCheck: StepRunStaleCheckService.Interface,
        private bypass: WorkflowBypassService.Interface,
        private logger: Logger.Interface
    ) {}

    public async execute(
        input: UpdateTargetFieldsInput,
        context: WorkflowAiTool.Context
    ): Promise<WorkflowAiTool.Result> {
        if (Object.keys(input.fields).length === 0) {
            return { ok: false, error: AI_TOOL_NO_FIELDS_MESSAGE };
        }
        try {
            // Right before the write, outside the bypass. The snapshot in `context.review` is the
            // review as the run started with it, so the stored one is read (R175).
            const stale = await this.staleCheck.isStale({
                reviewId: context.review.id,
                stepId: context.step.id,
                task: context.task
            });
            if (stale.isFail()) {
                // The service logged it; refuse instead of writing on an unverified step.
                return { ok: false, error: AI_TOOL_STEP_CHECK_FAILED_MESSAGE };
            }
            if (stale.value) {
                return { ok: false, error: AI_TOOL_STEP_NOT_RUNNING_MESSAGE };
            }

            // The write is awaited INSIDE `run`: the scope ends with the callback's promise.
            const result = await this.bypass.run(() =>
                this.editors.update({
                    model: context.review.model,
                    targetId: context.review.targetId,
                    targetRevisionId: context.review.targetRevisionId,
                    values: input.fields
                })
            );
            if (result.isFail()) {
                return { ok: false, error: result.error.message };
            }
            return { ok: true, data: { applied: result.value.applied } };
        } catch (error) {
            this.logger.error(
                {
                    err: error,
                    reviewId: context.review.id,
                    stepId: context.step.id,
                    taskId: context.task.id
                },
                "The AI tool could not update the target."
            );
            return { ok: false, error: "The target could not be updated." };
        }
    }
}

export const UpdateTargetFieldsTool = WorkflowAiTool.createImplementation({
    implementation: UpdateTargetFieldsToolImpl,
    dependencies: [
        ReviewTargetEditorService,
        StepRunStaleCheckService,
        WorkflowBypassService,
        Logger
    ]
});
