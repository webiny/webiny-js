import {
    TaskDefinition,
    TaskHandler
} from "@webiny/api-core/features/task/TaskDefinition/index.js";
import { Ai } from "@webiny/api-core/features/ai/index.js";
import {
    ResolveAiCapabilityUseCase,
    withAdditionalInstructions
} from "@webiny/ai-powerups/api/features/Capabilities/index.js";
import { ActivityLogStorage } from "~/core/abstractions.js";
import type { SummarySkipReason } from "~/core/types.js";
import { ACTIVITY_LOG_SUMMARY_CAPABILITY } from "./capability.js";
import { buildSummaryPrompt } from "./buildPrompt.js";
import { SUMMARISE_ACTIVITY_TASK_ID } from "./taskId.js";

export interface ISummariseActivityInput {
    /**
     * The whole payload.
     *
     * Values live on the activity record rather than here because task input is persisted as a
     * field on a `wbyTask` private CMS entry, retained indefinitely unless the definition opts into
     * cleanup, indexed into OpenSearch on `ddb-es`, and not cleaned at all when a task is created
     * but never executed. Content values would have had weaker guarantees there than on the record
     * they came from.
     */
    recordId: string;
    /**
     * The record's target and revision, so the job can find it with the per-target query the
     * feature already relies on rather than a cross-target scan.
     *
     * Identifiers, not content — the constraint on this payload is that it carries no values, and
     * these are both already on the record it points at.
     */
    targetId: string;
    revision: string;
}

/** Two sentences. Anything longer is the model ignoring its instructions, not a longer change. */
const MAX_SUMMARY_LENGTH = 600;

/**
 * Generates one record's summary, then clears the values that produced it.
 *
 * Every exit from this handler clears the bundle. That is the obligation, not the summary: the
 * summary is the feature, but the clear is what stops content values outliving the job that needed
 * them. A path that returned without clearing would leave values for the sweeper to reclaim later,
 * which means the defect would be invisible until someone went looking — so each failure mode has
 * a test asserting the bundle is gone, not merely that the job finished.
 *
 * Nothing here retries. A missing summary is a soft failure: the record keeps its deterministic
 * description and the timeline reads correctly, so the value of a retry is low and the cost of a
 * retry storm against a model provider is not.
 */
class SummariseActivityTaskHandlerImpl implements TaskHandler.Interface<ISummariseActivityInput> {
    constructor(
        private storage: ActivityLogStorage.Interface,
        private resolveCapability?: ResolveAiCapabilityUseCase.Interface,
        private ai?: Ai.Interface
    ) {}

    async run({
        input,
        controller
    }: TaskHandler.RunParams<ISummariseActivityInput>): Promise<
        TaskDefinition.Result<ISummariseActivityInput>
    > {
        if (controller.runtime.isAborted()) {
            return controller.response.aborted();
        }

        const record = await this.readRecord(input);

        if (!record) {
            // The entry was trashed and purged, or the revision deleted, while the job waited.
            // There is nothing to write to and nothing to clear — settling is a no-op by contract.
            return controller.response.done("The record no longer exists.");
        }

        const values = record.summaryState?.values ?? [];

        if (values.length === 0) {
            // Already settled, or already swept. Either way this job has nothing to do, and
            // writing anything would overwrite a result that is not ours.
            return controller.response.done("No values to summarise.");
        }

        if (!this.resolveCapability || !this.ai) {
            // The extension is not installed. The record keeps its deterministic description.
            return this.settle(
                controller,
                input.recordId,
                "ai-unavailable",
                "AI Power-Ups is not installed"
            );
        }

        const resolved = await this.resolveCapability.execute(ACTIVITY_LOG_SUMMARY_CAPABILITY);

        if (resolved.isFail()) {
            return this.settle(
                controller,
                input.recordId,
                "ai-unavailable",
                resolved.error.message
            );
        }

        const capability = resolved.value;

        let text: string;
        try {
            const result = await this.ai.generateText({
                model: capability.model,
                connection: capability.connection,
                system: withAdditionalInstructions(capability),
                prompt: buildSummaryPrompt(values),
                // Low, because this is description rather than composition. The same change
                // described differently on each run would make the timeline look unreliable.
                temperature: 0.2
            });

            text = (result.text ?? "").trim();
        } catch (error) {
            return this.settle(
                controller,
                input.recordId,
                "generation-failed",
                error instanceof Error ? error.message : String(error)
            );
        }

        if (text === "" || text.length > MAX_SUMMARY_LENGTH) {
            // Empty, or the model wrote an essay. Neither is usable, and storing an over-long
            // response would put a wall of content on a timeline row permanently.
            return this.settle(
                controller,
                input.recordId,
                "generation-failed",
                "unusable response"
            );
        }

        const stored = await this.storage.settleSummary({
            recordId: input.recordId,
            summary: text
        });

        if (stored.isFail()) {
            // The one failure worth reporting as an error: the summary exists and the values are
            // still on the record. The sweeper will reclaim them.
            return controller.response.error({ message: stored.error.message });
        }

        return controller.response.done("Summary stored.");
    }

    /**
     * Records why there is no summary, and clears the bundle in the same write.
     *
     * Used by every failure path, so there is exactly one place that has to remember to clear.
     */
    private async settle(
        controller: TaskHandler.RunParams<ISummariseActivityInput>["controller"],
        recordId: string,
        reason: SummarySkipReason,
        detail: string
    ) {
        const result = await this.storage.settleSummary({ recordId, reason });

        if (result.isFail()) {
            return controller.response.error({ message: result.error.message });
        }

        // Done rather than error: the feature behaved correctly and the record reads correctly.
        // Reporting a task failure for "no model configured" would fill a task list with noise.
        return controller.response.done(`No summary: ${reason} (${detail}).`);
    }

    /**
     * Reads the record the job was given.
     *
     * Storage has no get-by-id, deliberately — nothing else needs one, and a seventh operation is a
     * seventh promise the replacement store inherits. The per-target query serves instead, which is
     * why the payload carries the target and revision: scanning across targets to find one record
     * by id would be far more expensive than the query this feature is built on.
     *
     * A run is at most a handful of saves within one revision, so the first page reaches it.
     */
    private async readRecord(input: ISummariseActivityInput) {
        const listed = await this.storage.list({
            target: { type: "cms-entry", id: input.targetId },
            revision: input.revision,
            limit: 50
        });

        if (listed.isFail()) {
            return null;
        }

        return listed.value.records.find(record => record.id === input.recordId) ?? null;
    }
}

const SummariseActivityTaskHandler = TaskHandler.createImplementation({
    implementation: SummariseActivityTaskHandlerImpl,
    dependencies: [
        ActivityLogStorage,
        // Both optional for the same reason as `CapabilityAvailability`: the extension may not be
        // installed, and a task definition that cannot be built breaks the task runner for every
        // other task too.
        [ResolveAiCapabilityUseCase, { optional: true }],
        [Ai, { optional: true }]
    ]
});

class SummariseActivityTaskImpl implements TaskDefinition.Interface {
    public readonly id = SUMMARISE_ACTIVITY_TASK_ID;
    public readonly title = "Activity log - summarise a save";
    public readonly description =
        "Generates the short description of what changed in one content entry save.";
    /**
     * One pass. The job either produces a sentence or records why it could not; there is nothing
     * to continue, and a job that could iterate would be a job that could retry a model call.
     */
    public readonly maxIterations = 1;
    public readonly isPrivate = true;
    public readonly databaseLogs = false;
    /**
     * A backstop, not a guarantee. `selfCleanup` does not fire on a Lambda timeout and never fires
     * for a task created whose execution never starts, which is why the sweeper exists and why the
     * values live on the record rather than in this task's payload.
     */
    public readonly selfCleanup = "always" as const;

    handler = SummariseActivityTaskHandler;
}

export const SummariseActivityTaskDefinition = TaskDefinition.createImplementation({
    implementation: SummariseActivityTaskImpl,
    dependencies: []
});
