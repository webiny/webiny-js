import { defineLambdaEdgeRequestHandler, getHeader, setDomainOrigin } from "~/lambdaEdge";

import { pointsToFile, variantFixedKey, variantRandomKey, configPath } from "../utils/common";
import { GatewayConfig, loadConfig } from "../utils/loadConfig";
import { loadOriginPage } from "../utils/loadOriginPage";

export default defineLambdaEdgeRequestHandler(async event => {
    const cf = event.Records[0].cf;
    const request = cf.request;

    if (request.uri === configPath) {
        // requesting the config file, pass it through
        return request;
    }

    const config = await loadConfig(event);

    const variantFixed = getHeader(request.headers, variantFixedKey);
    if (variantFixed) {
        const variantConfig = config[variantFixed];
        if (variantConfig) {
            // If a proper variant was passed through header, we redirect to selected variant.
            setDomainOrigin(request, variantConfig.domain);
            return request;
        }
    }

    const variantRandom = Number(getHeader(request.headers, variantRandomKey));
    if (isNaN(variantRandom)) {
        // Random variant header should be always present.
        // It it's not, something bad happened, so we just pass request further.
        return request;
    }

    const variantConfig = getRandomVariant(config, variantRandom);
    if (!variantConfig) {
        // If no variant is matching the random value, just return 404.
        // This should happen only if there is really not a single variant serving traffic.
        return {
            status: "404",
            body: `No variant is found`
        };
    }

    // For file requests we just pass the request to proper origin.
    if (pointsToFile(request.uri)) {
        setDomainOrigin(request, variantConfig.domain);
        return request;
    }

    // For pages we make a custom HTTP request to the origin and transform page properly.
    // For example we change asset URLs to be absolute.
    return await loadOriginPage(variantConfig.domain, request.uri);
});

function getRandomVariant(config: GatewayConfig, random: number) {
    let totalWeight = 0;

    const stages = Object.keys(config);
    for (const stage of stages) {
        const stageConfig = config[stage];
        if (stageConfig.weight) {
            // do not count bad or negative weights
            totalWeight += stageConfig.weight;
        }
    }

    if (totalWeight <= 0 || random < 0) {
        return;
    }

    // Normalize random value to total weight of traffic splitting rates.
    random = (random * totalWeight) / 100;

    for (const version of stages) {
        const versionConfig = config[version];
        if (!versionConfig.weight) {
            continue;
        }

        if (random <= versionConfig.weight) {
            return config[version];
        } else {
            random -= versionConfig.weight;
        }
    }

    return;
}
