/**
 * The reserved variant id for the control bucket. The control bucket renders the baseline
 * revision content; it has no Variant object of its own.
 */
export const CONTROL_VARIANT_ID = "control";

export type DeviceType = "desktop" | "mobile" | "tablet";

export interface ExperimentTrafficSplit {
    control: number;
    variants: Record<string, number>;
}

export interface ExperimentTargeting {
    trafficPercentage: number;
    geo?: string[];
    device?: DeviceType[];
}

/**
 * Provider-agnostic analytics configuration carried by an experiment. Adapters read this and
 * map it to their own shape. No provider-specific field name appears here.
 */
export interface ExperimentAnalyticsConfig {
    provider: string;
    [key: string]: unknown;
}

export interface ActiveExperimentVariant {
    variantId: string;
    name: string;
}

/**
 * A variant's full content snapshot, shaped for rendering. Overlaid onto the baseline page so
 * the result is a complete, renderable page.
 */
export interface VariantContent {
    id: string;
    properties: Record<string, any>;
    bindings: Record<string, any>;
    elements: Record<string, any>;
    extensions: Record<string, any>;
    metadata: Record<string, any>;
}

/**
 * The active experiment for a path as returned by the Website Builder API. This is the only
 * experiment shape the render path deals with — it is provider-agnostic.
 */
export interface ActiveExperiment {
    experimentId: string;
    revisionId: string;
    pageEntryId: string;
    path: string;
    status: string;
    tenantId: string;
    controlVariantId: string;
    trafficSplit: ExperimentTrafficSplit;
    targeting: ExperimentTargeting;
    analytics: ExperimentAnalyticsConfig;
    variants: ActiveExperimentVariant[];
}

/**
 * Request-time context used to bucket a visitor. Derived server-side from request headers /
 * cookies — never from a logged-in identity.
 */
export interface VisitorContext {
    /** A stable visitor id (from the bucketing cookie, or a generated id). */
    visitorId: string;
    /** ISO country code, if the CDN/edge provided one. */
    country?: string;
    /** Device type, derived from the user agent. */
    device?: DeviceType;
}

export interface VariantAssignment {
    /** The assigned variant id, or the control variant id. */
    variantId: string;
    /** True when the control bucket (baseline revision) was assigned. */
    isControl: boolean;
    /**
     * True when the visitor was not entered into the experiment (targeting or traffic
     * percentage). The control is served and no exposure is emitted.
     */
    excluded: boolean;
    /** True when a forced-variant query parameter overrode bucketing (QA). Never reported. */
    forced: boolean;
}

/**
 * The single canonical exposure event. Each analytics provider adapter maps from this into its
 * own event shape. No PostHog (or other provider) field names may appear here.
 */
export interface ExposureEvent {
    experimentId: string;
    /** Optional human-readable experiment key for provider mapping (from analytics config). */
    experimentKey?: string;
    /** The assigned variant id (the control variant id for the control bucket). */
    variantId: string;
    revisionId: string;
    tenantId: string;
    /** Stable distinct visitor id. */
    visitorId: string;
    pageId: string;
    path: string;
    timestamp: string;
}

/**
 * The provider seam. A v2 GA4 adapter is a drop-in implementation of this interface — the data
 * model, assignment logic, and render path never change.
 */
export interface AnalyticsProvider {
    /** Provider id, matched against an experiment's analytics.provider. */
    readonly name: string;
    emitExposure(event: ExposureEvent): Promise<void>;
}
