import { createAbstraction } from "@webiny/feature/api";
import type { CmsModel } from "@webiny/api-headless-cms/types/index.js";
import { TaskService } from "@webiny/api-core/features/task/TaskService/index.js";
import { ActivityLogStorage } from "~/core/abstractions.js";
import type {
    ActivityRecord,
    ActivitySummaryState,
    ChangesetEntry,
    SummaryValueEntry
} from "~/core/types.js";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { ActivitySourceResolver } from "~/cms/recorder/abstractions.js";
import { ActivitySummaryConfig } from "./config.js";
import { SummaryModelAvailability } from "./availability.js";
import { bundleByteSize, extendValueBundle } from "./buildValueBundle.js";
import { routeSummary } from "./routeSummary.js";
import { SUMMARISE_ACTIVITY_TASK_ID } from "./taskId.js";

export interface IPlanSummaryParams {
    model: CmsModel;
    targetId: string;
    revision: string;
    changeset: ChangesetEntry[];
    before: Record<string, unknown> | undefined;
    after: Record<string, unknown>;
}

/**
 * What the recorder attaches to the record, and what it must do afterwards.
 *
 * Split into a plan and a follow-up because the record does not exist yet when the decision is
 * made: the values have to land in the same write as the record, and the job can only be handed an
 * id once there is one.
 */
export interface ISummaryPlan {
    /** Attached to the record at append time. */
    state: ActivitySummaryState | undefined;
    /** Set when this save joins a run already covered by a pending job. */
    extend?: { recordId: string; values: SummaryValueEntry[] };
    /** Set when this save starts a run and needs a job of its own. */
    dispatch?: boolean;
}

export interface ISummaryDispatcher {
    plan(params: IPlanSummaryParams): Promise<ISummaryPlan>;
    follow(plan: ISummaryPlan, record: ActivityRecord): Promise<void>;
}

export const SummaryDispatcher = createAbstraction<ISummaryDispatcher>(
    "ActivityLog/SummaryDispatcher"
);

export namespace SummaryDispatcher {
    export type Interface = ISummaryDispatcher;
    export type Plan = ISummaryPlan;
    export type PlanParams = IPlanSummaryParams;
}

/**
 * Whether a record is still waiting for the job that was dispatched for it.
 *
 * Pending is "carries values and has not settled". The dispatcher decides this itself from the
 * record it read rather than leaning on `extendSummaryValues` to refuse — a refusal is silent by
 * design, so a dispatcher that relied on it could not tell a joined run from a stranded save.
 */
const isPending = (record: ActivityRecord): boolean => {
    return (
        Boolean(record.summaryState?.values?.length) &&
        !record.summary &&
        !record.summaryState?.reason
    );
};

/**
 * Decides whether a save gets a job, and joins it to a run in progress where there is one.
 *
 * Everything here runs inside the recorder, therefore inside the write, therefore inside
 * `ActivityWriter`'s containment. Nothing in this class may throw: the recorder's own `try` is the
 * backstop, but a failure here must degrade to "no summary" rather than to a failed save.
 */
class SummaryDispatcherImpl implements ISummaryDispatcher {
    constructor(
        private storage: ActivityLogStorage.Interface,
        private sourceResolver: ActivitySourceResolver.Interface,
        private identityContext: IdentityContext.Interface,
        private availability: SummaryModelAvailability.Interface,
        private config: ActivitySummaryConfig.Interface,
        private taskService?: TaskService.Interface
    ) {}

    async plan(params: IPlanSummaryParams): Promise<ISummaryPlan> {
        const decision = routeSummary({
            model: params.model,
            changeset: params.changeset,
            before: params.before,
            after: params.after,
            source: this.sourceResolver.resolve(),
            aiAvailable: this.availability.isAvailable(),
            config: this.config
        });

        // Every skip returns here, before any read. A save routing deterministic — the
        // overwhelming majority — pays for the routing rule and nothing else.
        if (!decision.dispatch) {
            return { state: { reason: decision.reason } };
        }

        // Without a task service there is nothing to dispatch to. Treated as unavailable rather
        // than as an error: a project that has not registered background tasks gets the timeline
        // and no sentences, which is the same degradation as an unconfigured model.
        if (!this.taskService) {
            return { state: { reason: "ai-unavailable" } };
        }

        const previous = await this.findRunInProgress(params);

        if (previous) {
            const merged = extendValueBundle(previous.summaryState!.values!, decision.values);

            // A run stops growing at the ceiling rather than failing at it, so a long editing
            // session produces several summaries instead of one oversized nothing.
            if (bundleByteSize(merged) <= this.config.maxValueBytes) {
                return {
                    state: { reason: "covered-by-run" },
                    extend: { recordId: previous.id, values: merged }
                };
            }
        }

        return {
            state: {
                values: decision.values,
                valuesWrittenOn: new Date().toISOString()
            },
            dispatch: true
        };
    }

    async follow(plan: ISummaryPlan, record: ActivityRecord): Promise<void> {
        if (plan.extend) {
            // Best-effort. If the job settled between the lookup and here, storage refuses and this
            // save simply is not covered — the run's summary describes slightly less than it might
            // have, which the design accepts. Nothing is stranded: this record carries no values.
            await this.storage.extendSummaryValues(plan.extend);
            return;
        }

        if (!plan.dispatch || !this.taskService) {
            return;
        }

        await this.taskService.trigger({
            definition: SUMMARISE_ACTIVITY_TASK_ID,
            input: { recordId: record.id },
            delay: this.config.dispatchDelaySeconds
        });
    }

    /**
     * The newest record for this target, revision and actor, if it is still within the window and
     * still waiting for its job.
     *
     * One read, and only on the path that would otherwise dispatch — which is three CMS operations
     * plus a Step Functions call plus, because the dispatch is delayed, an extra Lambda invocation
     * before any work happens. The read is the cheaper half of that trade by a wide margin.
     */
    private async findRunInProgress(params: IPlanSummaryParams): Promise<ActivityRecord | null> {
        const listed = await this.storage.list({
            target: { type: "cms-entry", id: params.targetId },
            revision: params.revision,
            actorId: this.actorId(),
            limit: 1
        });

        if (listed.isFail()) {
            return null;
        }

        const previous = listed.value.records[0];

        if (!previous || !isPending(previous)) {
            return null;
        }

        const writtenOn = previous.summaryState?.valuesWrittenOn;

        if (!writtenOn) {
            return null;
        }

        const age = Date.now() - new Date(writtenOn).getTime();

        return Number.isFinite(age) && age <= this.config.debounceWindowMs ? previous : null;
    }

    /**
     * The actor the run is keyed on.
     *
     * Undefined when there is no identity to key on, which makes `findRunInProgress` return nothing
     * and the save start its own run — the safe direction, since joining the wrong person's run
     * would put one editor's changes inside another's summary.
     */
    private actorId(): string | undefined {
        const id = this.identityContext.getIdentity().id;
        return id === "" ? undefined : id;
    }
}

export const SummaryDispatcherImplementation = SummaryDispatcher.createImplementation({
    implementation: SummaryDispatcherImpl,
    dependencies: [
        ActivityLogStorage,
        ActivitySourceResolver,
        IdentityContext,
        SummaryModelAvailability,
        ActivitySummaryConfig,
        [TaskService, { optional: true }]
    ]
});
