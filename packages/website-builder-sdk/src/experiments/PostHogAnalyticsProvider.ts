import type { AnalyticsProvider, ExposureEvent } from "./types.js";

/**
 * The minimal shape of a PostHog client (server-side `posthog-node` or browser `posthog-js`).
 * The project supplies its own client so this package stays dependency-free and framework
 * agnostic — no PostHog package is bundled into the SDK.
 */
export interface PostHogClientLike {
    capture(params: {
        distinctId: string;
        event: string;
        properties?: Record<string, any>;
    }): void | Promise<void>;
}

export interface PostHogAnalyticsProviderOptions {
    /** Event name to emit. Defaults to "$experiment_exposure". */
    exposureEventName?: string;
}

/**
 * Maps the canonical {@link ExposureEvent} onto a PostHog capture call. PostHog attributes
 * experiment results from the `$feature/<experimentKey>` property carried on the exposure
 * event (and, project-side, on subsequent metric events) — no native PostHog feature flag is
 * required. This is the ONLY place PostHog-specific field names exist; they never reach the
 * data model, the assignment logic, or the render path.
 */
export class PostHogAnalyticsProvider implements AnalyticsProvider {
    public readonly name = "posthog";

    constructor(
        private client: PostHogClientLike,
        private options: PostHogAnalyticsProviderOptions = {}
    ) {}

    async emitExposure(event: ExposureEvent): Promise<void> {
        const featureKey = event.experimentKey ?? event.experimentId;

        await this.client.capture({
            distinctId: event.visitorId,
            event: this.options.exposureEventName ?? "$experiment_exposure",
            properties: {
                // PostHog reads this property to attribute exposures and metrics to a variant.
                [`$feature/${featureKey}`]: event.variantId,
                experiment_id: event.experimentId,
                variant_id: event.variantId,
                revision_id: event.revisionId,
                tenant_id: event.tenantId,
                page_id: event.pageId,
                path: event.path,
                $current_url: event.path,
                timestamp: event.timestamp
            }
        });
    }
}
