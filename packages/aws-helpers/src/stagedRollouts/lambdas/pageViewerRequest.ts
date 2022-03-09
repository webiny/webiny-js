import { CloudFrontRequest, defineLambdaEdgeRequestHandler } from "~/lambdaEdge";

import { variantCookie, variantHeader } from "../utils/common";
import { GatewayConfig, isConfigRequest, loadConfig } from "../utils/config";
import { getHeader, getRequestCookies, setHeader } from "../utils/headers";

export const pageViewerRequest = defineLambdaEdgeRequestHandler(async event => {
    const cf = event.Records[0].cf;
    const request = cf.request;

    if (isConfigRequest(request)) {
        // requesting the config file, pass it through
        return request;
    }

    let stage =
        //  Try to get stage name from header.
        getHeader(request.headers, variantHeader) ||
        // Try to get stage name from cookie.
        getRequestCookies(request)[variantCookie];

    if (stage) {
        // If there is a sticky session cookie, we just pass it further to origin request handler.
        // Maybe the result is already cached, so we will gain some miliseconds.
        return selectStage(request, stage);
    }

    // Otherwise we have to load the gateway config.
    const config = await loadConfig(event);
    stage = getRandomStage(config);
    if (stage) {
        return selectStage(request, stage);
    }

    return {
        status: "404",
        body: "No deployed stage found"
    };
});

function getRandomStage(config: GatewayConfig) {
    let totalWeight = 0;

    const stages = Object.keys(config);
    for (const stage of stages) {
        const stageConfig = config[stage];
        if (stageConfig.weight) {
            // do not count bad or negative weights
            totalWeight += stageConfig.weight;
        }
    }

    if (totalWeight <= 0) {
        return;
    }

    let random = Math.random() * totalWeight;

    console.log(`Randomized ${random}/${totalWeight}`);
    for (const version of stages) {
        const versionConfig = config[version];
        if (!versionConfig.weight) {
            continue;
        }

        console.log(`Version ${version}, weight ${versionConfig.weight}/${random}`);

        if (random <= versionConfig.weight) {
            return version;
        } else {
            random -= versionConfig.weight;
        }
    }

    return;
}

function selectStage(request: CloudFrontRequest, stage: string) {
    console.log(`Forwarding to ${stage}`);

    setHeader(request.headers, {
        key: variantHeader,
        value: stage
    });

    return request;
}
