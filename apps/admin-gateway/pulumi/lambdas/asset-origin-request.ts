import { defineLambdaEdgeRequestHandler } from "@webiny/aws-helpers";

import { loadConfig } from "../utils/config";
import { setDomainOrigin } from "../utils/origin";

const pathRegex = /^\/_assets\/(.*?)(\/.*)/;

export default defineLambdaEdgeRequestHandler(async event => {
    const cf = event.Records[0].cf;
    const request = cf.request;

    const match = pathRegex.exec(request.uri);

    if (!match) {
        return {
            status: "404"
        };
    }

    // retrieve a name of the stage
    const stageName = match[1];
    // retrieve the rest of the asset file path
    const assetPath = match[2];

    const config = await loadConfig(event);
    const stageConfig = config[stageName];
    if (!stageConfig) {
        return {
            status: "404"
        };
    }

    console.log(`Forwarding to ${stageConfig.domain}`);

    setDomainOrigin(request, stageConfig.domain);
    request.uri = assetPath;

    return request;
});
