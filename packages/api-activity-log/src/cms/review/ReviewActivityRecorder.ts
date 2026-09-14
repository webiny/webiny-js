import { getModelIdFromAppName } from "@webiny/api-headless-cms-workflows/utils/appName.js";
import {
    ActivityWriter,
    ReviewActivityRecorder as Abstraction,
    type IRecordReviewActivityParams
} from "~/cms/recorder/abstractions.js";
import { hasNote as stepHasNote, identifyStep, toSubject } from "./identifyStep.js";

/**
 * Records a publishing workflow transition against the entry under review.
 *
 * Two things make this simpler than the 5.44 design assumed. `targetId` and `targetRevisionId` sit
 * directly on the workflow state, so reaching the entry is one hop rather than two through a step.
 * And `app` is `cms.<modelId>`, so `getModelIdFromAppName` both identifies the model and — by
 * returning null for anything else — filters out non-CMS targets.
 *
 * `targetRevisionId` populates the record's revision, so a review transition groups with the saves
 * it relates to instead of floating free of them.
 *
 * Website Builder targets are **out of scope for this checkpoint, not silently dropped**: they are
 * skipped with a log line, so the gap is visible in a deployment rather than looking like capture
 * that simply never fires.
 */
class ReviewActivityRecorderImpl implements Abstraction.Interface {
    constructor(private writer: ActivityWriter.Interface) {}

    async record(params: IRecordReviewActivityParams): Promise<void> {
        try {
            const { state, action, correlationId } = params;

            const modelId = getModelIdFromAppName(state.app);

            if (!modelId) {
                this.skipNonCmsTarget(params);
                return;
            }

            const step = identifyStep(action, state.steps ?? []);

            // Note presence is derived from the step rather than passed in: the action events do
            // not carry the comment, and the step is the authoritative record of whether one was
            // written. `params.hasNote` overrides only when a caller genuinely knows better.
            const noteAttached = params.hasNote ?? (step ? stepHasNote(step) : undefined);

            await this.writer.write({
                targetId: state.targetId,
                revision: state.targetRevisionId,
                action,
                correlationId,
                ...(step ? { subject: toSubject(step) } : {}),
                ...(noteAttached === undefined ? {} : { hasNote: noteAttached })
            });
        } catch (error) {
            this.report(params, error);
        }
    }

    private skipNonCmsTarget(params: IRecordReviewActivityParams): void {
        try {
            console.info(
                `[activity-log] Skipping review activity "${params.action}" for app ` +
                    `"${params.state?.app}": only CMS entry targets are recorded. Website ` +
                    `Builder targets are out of scope.`
            );
        } catch {
            // Logging must not break the workflow write.
        }
    }

    private report(params: IRecordReviewActivityParams, error: unknown): void {
        try {
            console.error(
                `[activity-log] Failed to record review activity "${params.action}" for ` +
                    `target "${params.state?.targetId}". The workflow write was not affected.`,
                error
            );
        } catch {
            // Logging must not break the workflow write.
        }
    }
}

export const ReviewActivityRecorder = Abstraction.createImplementation({
    implementation: ReviewActivityRecorderImpl,
    dependencies: [ActivityWriter]
});
