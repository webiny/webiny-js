import { type Container, createFeature } from "@webiny/feature/api";
import { ActivitySummaryConfig, DEFAULT_ACTIVITY_SUMMARY_CONFIG } from "./config.js";
import type { IActivitySummaryConfig } from "./config.js";
import { SummaryDispatcherImplementation } from "./SummaryDispatcher.js";
import { ActivityLogSummaryCapability } from "./capability.js";
import { CapabilityAvailability } from "./CapabilityAvailability.js";
import { SummariseActivityTaskDefinition } from "./SummariseActivityTaskDefinition.js";

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
 * The capability registers unconditionally, following AI Power-Ups' own features: the licence is
 * not loaded during `register`, so a gate here would read `NullLicense` and always be false.
 * Availability is answered at dispatch time instead, and a project with no model configured gets
 * the timeline with every record carrying `ai-unavailable`.
 */
export const ActivitySummaryFeature = createFeature<IActivitySummaryFeatureParams>({
    name: "ActivityLog/Summary",
    register(container: Container, params: IActivitySummaryFeatureParams) {
        container.registerInstance(ActivitySummaryConfig, {
            ...DEFAULT_ACTIVITY_SUMMARY_CONFIG,
            ...params?.config
        });
        container.register(ActivityLogSummaryCapability);
        container.register(CapabilityAvailability).inSingletonScope();
        container.register(SummariseActivityTaskDefinition);
        container.register(SummaryDispatcherImplementation);
    }
});
