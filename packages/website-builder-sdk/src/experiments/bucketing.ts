import type {
    ActiveExperiment,
    ExperimentTargeting,
    VariantAssignment,
    VisitorContext
} from "./types.js";

/**
 * cyrb53 — a fast, well-distributed non-cryptographic string hash. Deterministic across
 * runtimes, which is what makes server-side bucketing stable for a given visitor + experiment.
 */
export const cyrb53 = (str: string, seed = 0): number => {
    let h1 = 0xdeadbeef ^ seed;
    let h2 = 0x41c6ce57 ^ seed;
    for (let i = 0; i < str.length; i++) {
        const ch = str.charCodeAt(i);
        h1 = Math.imul(h1 ^ ch, 2654435761);
        h2 = Math.imul(h2 ^ ch, 1597334677);
    }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507);
    h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507);
    h2 ^= Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    return 4294967296 * (2097151 & h2) + (h1 >>> 0);
};

/** Hash a seed to a stable number in the half-open interval [0, 1). */
export const hashToUnit = (seed: string): number => {
    return cyrb53(seed) / 9007199254740992;
};

/**
 * Whether a visitor matches the experiment's geo/device targeting. Tenant scoping is implicit:
 * the experiment id is unique within a tenant, so a visitor's bucket never crosses tenants.
 */
export const matchesTargeting = (targeting: ExperimentTargeting, ctx: VisitorContext): boolean => {
    if (targeting.geo && targeting.geo.length > 0) {
        if (!ctx.country || !targeting.geo.includes(ctx.country)) {
            return false;
        }
    }
    if (targeting.device && targeting.device.length > 0) {
        if (!ctx.device || !targeting.device.includes(ctx.device)) {
            return false;
        }
    }
    return true;
};

/**
 * Deterministically assign a visitor to the control bucket or a variant.
 *
 * 1. If geo/device targeting excludes the visitor → control, excluded (no exposure).
 * 2. If the visitor falls outside the traffic percentage → control, excluded (no exposure).
 * 3. Otherwise bucket among the control + variants by their weights, seeded by
 *    visitorId + experimentId so the result is stable and tenant-isolated.
 */
export const assignVariant = (
    experiment: ActiveExperiment,
    ctx: VisitorContext
): VariantAssignment => {
    const controlVariantId = experiment.controlVariantId;
    const control: VariantAssignment = {
        variantId: controlVariantId,
        isControl: true,
        excluded: true,
        forced: false
    };

    if (!matchesTargeting(experiment.targeting, ctx)) {
        return control;
    }

    const trafficPercentage = experiment.targeting.trafficPercentage ?? 100;
    const inclusion = hashToUnit(`${ctx.visitorId}:${experiment.experimentId}:inclusion`);
    if (inclusion >= trafficPercentage / 100) {
        return control;
    }

    // Build the bucket list: control first, then every variant that is both ready (present in
    // experiment.variants) and assigned a weight in the traffic split.
    const readyVariantIds = new Set(experiment.variants.map(variant => variant.variantId));
    const buckets: Array<{ id: string; weight: number }> = [
        { id: controlVariantId, weight: Math.max(0, experiment.trafficSplit.control) }
    ];
    for (const [variantId, weight] of Object.entries(experiment.trafficSplit.variants)) {
        if (readyVariantIds.has(variantId) && weight > 0) {
            buckets.push({ id: variantId, weight });
        }
    }

    const totalWeight = buckets.reduce((sum, bucket) => sum + bucket.weight, 0);
    if (totalWeight <= 0) {
        return { variantId: controlVariantId, isControl: true, excluded: false, forced: false };
    }

    let roll = hashToUnit(`${ctx.visitorId}:${experiment.experimentId}`) * totalWeight;
    for (const bucket of buckets) {
        roll -= bucket.weight;
        if (roll < 0) {
            return {
                variantId: bucket.id,
                isControl: bucket.id === controlVariantId,
                excluded: false,
                forced: false
            };
        }
    }

    // Floating-point edge: fall back to the last bucket.
    const last = buckets[buckets.length - 1];
    return {
        variantId: last.id,
        isControl: last.id === controlVariantId,
        excluded: false,
        forced: false
    };
};

/**
 * A forced assignment for QA/review. Overrides bucketing and is never counted in results.
 * Returns null when the forced id does not match the control or any ready variant.
 */
export const forcedAssignment = (
    experiment: ActiveExperiment,
    forcedVariantId: string
): VariantAssignment | null => {
    if (forcedVariantId === experiment.controlVariantId) {
        return { variantId: forcedVariantId, isControl: true, excluded: false, forced: true };
    }
    const isReady = experiment.variants.some(variant => variant.variantId === forcedVariantId);
    if (!isReady) {
        return null;
    }
    return { variantId: forcedVariantId, isControl: false, excluded: false, forced: true };
};
