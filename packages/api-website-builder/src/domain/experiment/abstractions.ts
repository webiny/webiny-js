import { createAbstraction } from "@webiny/feature/api";
import type { CmsModel } from "@webiny/api-headless-cms/types/index.js";
import type { WbIdentity } from "~/domain/shared/abstractions.js";

/**
 * The reserved variant id used for the control bucket. The control bucket renders the
 * baseline revision directly, so it has no Variant object of its own.
 */
export const CONTROL_VARIANT_ID = "control";

export type ExperimentStatus = "draft" | "running" | "stopped" | "graduated";

export type DeviceType = "desktop" | "mobile" | "tablet";

/**
 * Traffic split between the control bucket and each variant, expressed in whole percentages
 * that sum to 100. Variants are keyed by their Variant entryId.
 */
export interface ExperimentTrafficSplit {
    control: number;
    variants: Record<string, number>;
}

export interface ExperimentTargeting {
    /** Percentage (0-100) of eligible visitors entered into the experiment. */
    trafficPercentage: number;
    /** Optional ISO country codes the experiment is limited to. */
    geo?: string[];
    /** Optional device types the experiment is limited to. */
    device?: DeviceType[];
}

/**
 * Conversion goals. Opaque to Webiny — forwarded to the analytics provider as-is.
 */
export interface ExperimentGoals {
    primaryMetric?: string;
    [key: string]: unknown;
}

/**
 * Provider-agnostic analytics configuration. No provider-specific field name may leak into
 * the render path or the assignment logic — adapters read this and map it to their own shape.
 */
export interface ExperimentAnalyticsConfig {
    provider: string;
    [key: string]: unknown;
}

export interface CmsEntryWbExperimentValues {
    pageEntryId: string;
    baselineRevisionId: string;
    status: ExperimentStatus;
    name: string;
    trafficSplit: ExperimentTrafficSplit;
    targeting: ExperimentTargeting;
    goals: ExperimentGoals;
    analytics: ExperimentAnalyticsConfig;
    startedOn: string | null;
    stoppedOn: string | null;
    winningVariantId: string | null;
}

export interface WbExperiment extends CmsEntryWbExperimentValues {
    id: string;
    entryId: string;
    version: number;
    locked: boolean;
    createdOn: string;
    createdBy: WbIdentity;
    savedOn: string;
    savedBy: WbIdentity;
    tenant: string;
}

/**
 * ExperimentModel abstraction - represents the Website Builder experiment CMS model.
 * Registered via container.registerInstance in the composite feature.
 */
/**
 * Provides the tenant's Website Builder experiment CMS model.
 *
 * A provider rather than the model itself: fetching a model is asynchronous and tenant-dependent,
 * while DI resolution is synchronous — so an already-resolved `CmsModel` could only be supplied by
 * something running before every consumer. Consumers `await get()` at the point of use.
 */
export interface IExperimentModelProvider {
    get(): Promise<CmsModel>;
}

export const ExperimentModelProvider = createAbstraction<IExperimentModelProvider>(
    "Wb/ExperimentModelProvider"
);

export namespace ExperimentModelProvider {
    export type Interface = IExperimentModelProvider;
}
