import crypto from "crypto";

/*
 * Identifies one render of the project config, so that asking for the same config twice renders it
 * once.
 *
 * The render arguments are one input. The WCP license is the other: `WcpProjectLicenseProvider`
 * reads it from `WCP_PROJECT_LICENSE`, and license-gated feature flags decide which extensions the
 * rendered config contains. It has to be part of the key, because the project SDK renders the config
 * before it knows the license (it needs the config to find the WCP project in the first place) and
 * again after. Without it, that second read would be a cache hit, and everything would carry on
 * with a config rendered as though the project had no license.
 *
 * The license is hashed because it is a few kilobytes of base64, and only its identity matters here.
 */
export const getRenderCacheKey = (renderArgs: Record<string, any> | undefined): string => {
    const license = process.env.WCP_PROJECT_LICENSE;

    let licenseHash: string | null = null;
    if (license) {
        licenseHash = crypto.createHash("sha1").update(license).digest("hex");
    }

    return JSON.stringify({ renderArgs: renderArgs ?? null, license: licenseHash });
};
