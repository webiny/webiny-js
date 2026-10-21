import zod from "zod";
import { Logger } from "@webiny/api-core/features/logger/index.js";
import { ReviewTargetEditorService } from "~/features/review/ReviewTargetEditorService/index.js";
import { WorkflowAiTool } from "~/features/aiTools/WorkflowAiTool/abstractions.js";
import {
    AI_STEP_CONTENT_TOO_LARGE_MESSAGE,
    AI_STEP_MAX_INPUT_CHARACTERS,
    READ_TARGET_TOOL_NAME
} from "~/features/aiTools/constants.js";

const readTargetInputSchema = zod.object({});

type ReadTargetInput = zod.infer<typeof readTargetInputSchema>;

/**
 * Built-in tool (R173): the content under review, every field with `writable` (R172). It takes no
 * input: the target comes from the review snapshot in the context, never from the model (Review
 * Focus 2). Reads only; no stale check and no bypass. It holds no per-call state: the registry
 * keeps one instance per container.
 */
class ReadTargetToolImpl implements WorkflowAiTool.Interface<ReadTargetInput> {
    public readonly name = READ_TARGET_TOOL_NAME;
    public readonly title = "Read target";
    public readonly description =
        "Reads the content under review: its title and every field with its path, label, type, current value and whether it can be written. Takes no input. Call it before updateTargetFields, and use the paths it returns.";
    public readonly changesContent = false;
    public readonly inputSchema = readTargetInputSchema;

    public constructor(
        private editors: ReviewTargetEditorService.Interface,
        private logger: Logger.Interface
    ) {}

    public async execute(
        _input: ReadTargetInput,
        context: WorkflowAiTool.Context
    ): Promise<WorkflowAiTool.Result> {
        try {
            const result = await this.editors.read({
                model: context.review.model,
                targetId: context.review.targetId,
                targetRevisionId: context.review.targetRevisionId
            });
            if (result.isFail()) {
                return { ok: false, error: result.error.message };
            }
            // Never truncate: the model must not decide on content it did not see (R175).
            if (JSON.stringify(result.value).length > AI_STEP_MAX_INPUT_CHARACTERS) {
                return { ok: false, error: AI_STEP_CONTENT_TOO_LARGE_MESSAGE };
            }
            return { ok: true, data: result.value };
        } catch (error) {
            this.logger.error(
                {
                    err: error,
                    reviewId: context.review.id,
                    stepId: context.step.id,
                    taskId: context.task.id
                },
                "The AI tool could not read the target."
            );
            return { ok: false, error: "The target could not be read." };
        }
    }
}

export const ReadTargetTool = WorkflowAiTool.createImplementation({
    implementation: ReadTargetToolImpl,
    dependencies: [ReviewTargetEditorService, Logger]
});
