import type { AnalyticsProvider } from "./types.js";

/**
 * A small registry mapping a provider id (e.g. "posthog") to its adapter. The render path
 * looks the provider up by the experiment's analytics.provider value, so adding a GA4 adapter
 * later requires no change to assignment or the render path.
 */
const providers = new Map<string, AnalyticsProvider>();

export const registerAnalyticsProvider = (provider: AnalyticsProvider): void => {
    providers.set(provider.name, provider);
};

export const getAnalyticsProvider = (name: string): AnalyticsProvider | undefined => {
    return providers.get(name);
};

export const clearAnalyticsProviders = (): void => {
    providers.clear();
};
