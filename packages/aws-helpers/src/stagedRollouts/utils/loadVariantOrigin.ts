import { CloudFrontRequestEvent, getHeader, notFoundResponse } from "~/lambdaEdge";

import { variantFixedKey, variantRandomKey } from "../utils/common";
import { GatewayConfig, loadTrafficSplittingConfig } from "../utils/loadTrafficSplittingConfig";
import { logDebug } from "./log";

export async function loadVariantOrigin(event: CloudFrontRequestEvent) {
    const cf = event.Records[0].cf;
    const request = cf.request;

    const config = await loadTrafficSplittingConfig(event);

    const variantFixed = getHeader(request.headers, variantFixedKey);
    if (variantFixed) {
        const variantConfig = config[variantFixed];
        if (variantConfig) {
            return { variant: variantConfig };
        } else {
            return notFoundResponse(`No variant ${variantFixed} found`);
        }
    }

    const variantRandom = Number(getHeader(request.headers, variantRandomKey));
    if (isNaN(variantRandom)) {
        logDebug("No random variant passed, passing the request");
        // Random variant header should be always present.
        // It it's not, something bad happened, so we just pass request further.
        return request;
    }

    logDebug(`Variant random ${variantRandom}`);

    const variantConfig = getRandomVariant(config, variantRandom);
    if (!variantConfig) {
        // If no variant is matching the random value, just return 404.
        // This should happen only if there is really not a single variant serving traffic.
        logDebug(`No variant is found`);
        return notFoundResponse(`No variant is found`);
    }

    return { variant: variantConfig };
}

function getRandomVariant(config: GatewayConfig, random: number) {
    let totalWeight = 0;

    const variants = Object.keys(config);
    for (const variant of variants) {
        const variantConfig = config[variant];
        if (variantConfig.weight) {
            // do not count bad or negative weights
            totalWeight += variantConfig.weight;
        }
    }

    if (totalWeight <= 0 || random < 0) {
        return;
    }

    // Normalize random value to total weight of traffic splitting rates.
    random = (random * totalWeight) / 100;

    for (const variant of variants) {
        const variantConfig = config[variant];
        if (!variantConfig.weight) {
            continue;
        }

        if (random <= variantConfig.weight) {
            logDebug(`Variant ${variant} selected`);
            return config[variant];
        } else {
            random -= variantConfig.weight;
        }
    }

    return;
}
