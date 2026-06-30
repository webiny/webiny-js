import { nanoid } from "nanoid";
import type { PublicPage } from "~/types.js";
import { getHeadersProvider } from "~/headersProvider.js";
import { assignVariant, forcedAssignment } from "./bucketing.js";
import { getAnalyticsProvider } from "./analyticsProvider.js";
import type {
    ActiveExperiment,
    DeviceType,
    VariantAssignment,
    VariantContent,
    VisitorContext
} from "./types.js";

/** The cookie that persists the stable visitor id used for deterministic bucketing. */
export const DEFAULT_VISITOR_COOKIE = "wb_ab_vid";

/** Default query parameter used to force a variant for QA/review. */
export const FORCED_VARIANT_PARAM = "wb-variant";

const DEFAULT_GEO_HEADERS = [
    "x-vercel-ip-country",
    "cloudfront-viewer-country",
    "cf-ipcountry",
    "x-country-code"
];

/** The minimal data surface the render helper needs. ContentSdk satisfies this. */
export interface ExperimentSdk {
    getPage(path: string): Promise<PublicPage | null>;
    getPageExperiment(path: string): Promise<ActiveExperiment | null>;
    getVariantContent(variantId: string): Promise<VariantContent | null>;
}

export interface ExperimentCookie {
    name: string;
    value: string;
    maxAge: number;
}

export interface GetPageWithExperimentOptions {
    /** Forced variant id (from the `?wb-variant=` query parameter). Overrides bucketing, never counted. */
    forcedVariantId?: string;
    /** Explicit visitor id. When omitted, it is read from the cookie or generated. */
    visitorId?: string;
    /** Explicit ISO country code. When omitted, it is read from common CDN geo headers. */
    country?: string;
    /** Explicit device type. When omitted, it is derived from the user agent. */
    device?: DeviceType;
    /** Header names to read the visitor country from, in priority order. */
    geoHeaders?: string[];
    /** Bucketing cookie name. Defaults to `wb_ab_vid`. */
    cookieName?: string;
    /** Bucketing cookie max age in seconds. Defaults to one year. */
    cookieMaxAge?: number;
    /** Set false to skip exposure emission (e.g. when consent has not been granted). */
    emitExposure?: boolean;
    /** Visitor id generator. Defaults to nanoid. */
    generateVisitorId?: () => string;
}

export interface ExperimentRenderResult {
    /** The content to render server-side: the baseline (control) or a variant overlay. */
    page: PublicPage | null;
    /** The active experiment, or null when there is none for the path. */
    experiment: ActiveExperiment | null;
    /** The visitor's assignment, or null when no experiment applies. */
    assignment: VariantAssignment | null;
    /**
     * Set when the caller should persist the bucketing cookie (i.e. a visitor id was generated
     * this request). Persisting it in a Route Handler / middleware keeps bucketing stable.
     */
    cookie?: ExperimentCookie;
}

const readCookie = (cookieHeader: string | null | undefined, name: string): string | undefined => {
    if (!cookieHeader) {
        return undefined;
    }
    for (const part of cookieHeader.split(";")) {
        const index = part.indexOf("=");
        if (index === -1) {
            continue;
        }
        const key = part.slice(0, index).trim();
        if (key === name) {
            return decodeURIComponent(part.slice(index + 1).trim());
        }
    }
    return undefined;
};

const detectDevice = (userAgent: string | null | undefined): DeviceType | undefined => {
    if (!userAgent) {
        return undefined;
    }
    if (/iPad|Tablet|PlayBook|Silk/i.test(userAgent)) {
        return "tablet";
    }
    if (/Mobi|Android.+Mobile|iPhone|iPod|Windows Phone/i.test(userAgent)) {
        return "mobile";
    }
    return "desktop";
};

/**
 * Resolve request-time visitor context from request headers/cookies. Never uses a logged-in
 * identity. Returns whether a visitor id was generated, so the caller can persist the cookie.
 */
export const resolveVisitorContext = async (
    options: GetPageWithExperimentOptions = {}
): Promise<{ context: VisitorContext; generatedVisitorId: boolean }> => {
    const cookieName = options.cookieName ?? DEFAULT_VISITOR_COOKIE;
    const generate = options.generateVisitorId ?? (() => nanoid());

    let headers: Headers | undefined;
    const provider = getHeadersProvider();
    if (provider) {
        try {
            headers = await provider();
        } catch {
            headers = undefined;
        }
    }

    let visitorId = options.visitorId;
    let generatedVisitorId = false;
    if (!visitorId) {
        visitorId = readCookie(headers?.get("cookie"), cookieName);
    }
    if (!visitorId) {
        visitorId = generate();
        generatedVisitorId = true;
    }

    let country = options.country;
    if (!country && headers) {
        for (const header of options.geoHeaders ?? DEFAULT_GEO_HEADERS) {
            const value = headers.get(header);
            if (value) {
                country = value.toUpperCase();
                break;
            }
        }
    }

    const device = options.device ?? detectDevice(headers?.get("user-agent"));

    return { context: { visitorId, country, device }, generatedVisitorId };
};

const overlayVariant = (baseline: PublicPage, variant: VariantContent): PublicPage => {
    return {
        ...baseline,
        properties: variant.properties as PublicPage["properties"],
        bindings: variant.bindings as PublicPage["bindings"],
        elements: variant.elements as PublicPage["elements"],
        extensions: variant.extensions,
        metadata: variant.metadata
    };
};

/**
 * Resolve and render the right page for a visitor, server-side, with no client-side content
 * swap.
 *
 * Caching contract (important — handled here so projects do not reimplement it):
 *  - The baseline (control) is fetched via `getPage(path)` and caches per path.
 *  - The active experiment metadata is fetched via `getPageExperiment(path)` and caches per path.
 *  - A variant's content is fetched via `getVariantContent(variantId)` and caches per variant id.
 * Every request therefore resolves to one of a small, fixed set of cacheable objects keyed by
 * (path) or (variant id) — NEVER by the raw visitor id. Each active variant adds exactly one
 * cacheable object per URL.
 */
export const getPageWithExperiment = async (
    sdk: ExperimentSdk,
    path: string,
    options: GetPageWithExperimentOptions = {}
): Promise<ExperimentRenderResult> => {
    // Baseline content + active experiment. Both cache per path.
    const [controlPage, experiment] = await Promise.all([
        sdk.getPage(path),
        sdk.getPageExperiment(path)
    ]);

    if (!experiment || !controlPage) {
        return { page: controlPage, experiment: experiment ?? null, assignment: null };
    }

    const { context, generatedVisitorId } = await resolveVisitorContext(options);

    let assignment: VariantAssignment | null = null;
    if (options.forcedVariantId) {
        assignment = forcedAssignment(experiment, options.forcedVariantId);
    }
    if (!assignment) {
        assignment = assignVariant(experiment, context);
    }

    let page = controlPage;
    if (!assignment.isControl) {
        const variant = await sdk.getVariantContent(assignment.variantId);
        if (variant) {
            page = overlayVariant(controlPage, variant);
        } else {
            // The variant disappeared (e.g. deleted) — fall back to the control safely.
            assignment = {
                variantId: experiment.controlVariantId,
                isControl: true,
                excluded: assignment.excluded,
                forced: assignment.forced
            };
        }
    }

    // Emit a single canonical exposure event through the provider seam. Forced and excluded
    // assignments are never reported. Analytics failures must never break rendering.
    const shouldEmit = (options.emitExposure ?? true) && !assignment.excluded && !assignment.forced;
    if (shouldEmit) {
        const provider = getAnalyticsProvider(experiment.analytics.provider);
        if (provider) {
            const experimentKey =
                typeof experiment.analytics.experimentKey === "string"
                    ? experiment.analytics.experimentKey
                    : undefined;
            try {
                await provider.emitExposure({
                    experimentId: experiment.experimentId,
                    experimentKey,
                    variantId: assignment.variantId,
                    revisionId: experiment.revisionId,
                    tenantId: experiment.tenantId,
                    visitorId: context.visitorId,
                    pageId: experiment.pageEntryId,
                    path: experiment.path,
                    timestamp: new Date().toISOString()
                });
            } catch {
                // Swallow — exposure measurement must never affect the rendered response.
            }
        }
    }

    const result: ExperimentRenderResult = { page, experiment, assignment };

    if (generatedVisitorId) {
        result.cookie = {
            name: options.cookieName ?? DEFAULT_VISITOR_COOKIE,
            value: context.visitorId,
            maxAge: options.cookieMaxAge ?? 60 * 60 * 24 * 365
        };
    }

    return result;
};
