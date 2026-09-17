import { type Container, createFeature } from "@webiny/feature/api";
import { ActivitySummaryConfig, DEFAULT_ACTIVITY_SUMMARY_CONFIG } from "./config.js";
import type { IActivitySummaryConfig } from "./config.js";
import { SummaryDispatcherImplementation } from "./SummaryDispatcher.js";
import { UnavailableSummaryModel } from "./availability.js";

export interface IActivitySummaryFeatureParams {
    config?: Partial<IActivitySummaryConfig>;
}

/**
 * The summary path's own registrations.
 *
 * Registered unconditionally alongside the rest of the feature. The `enabled` switch lives in the
 * config rather than here so that turning summaries off still leaves the dispatcher in place to
 * record *why* each save was skipped — an installation with summaries off should be diagnosable,
 * not silent.
 *
 * `UnavailableSummaryModel` answers false until the capability is registered, so nothing dispatches
 * and every record carries `ai-unavailable`. The checkpoint that adds the job replaces it.
 */
export const ActivitySummaryFeature = createFeature<IActivitySummaryFeatureParams>({
    name: "ActivityLog/Summary",
    register(container: Container, params: IActivitySummaryFeatureParams) {
        container.registerInstance(ActivitySummaryConfig, {
            ...DEFAULT_ACTIVITY_SUMMARY_CONFIG,
            ...params?.config
        });
        container.register(UnavailableSummaryModel).inSingletonScope();
        container.register(SummaryDispatcherImplementation);
    }
});
