import type { IAiPowerUpsSettings } from "~/admin/features/settings/shared/abstractions.js";

/**
 * Whether a feature that runs on the Standard role has something to run on.
 *
 * The AI entry points hide themselves when the project has no model configured, and they used to
 * test `providers.presets.length > 0` for it. That test passed for a row with no key in it, so the
 * button appeared and the request failed. This one checks the whole chain the api will walk: the
 * role is filled, the connection it names still exists, and that connection has a key.
 *
 * Admin only ever sees the masked key, and the mask is non-empty exactly when a key is stored, so
 * it answers the question without the plaintext leaving the api.
 */
export const hasUsableModel = (settings: IAiPowerUpsSettings | null): boolean => {
    const standard = settings?.modelRoles?.roles?.["standard"];

    if (!standard?.model || !standard.connectionId) {
        return false;
    }

    const connection = settings?.connections?.presets?.find(c => c.id === standard.connectionId);

    return Boolean(connection?.apiKey);
};
