import {
    CloudFrontRequestEvent,
    CloudFrontResponse,
    defineLambdaEdgeRequestHandler,
    setHeader
} from "~/lambdaEdge";

import { get } from "https";

export default defineLambdaEdgeRequestHandler(async event => {
    try {
        const configJson = await loadConfigJson(event);
        const response: CloudFrontResponse = {
            status: "200",
            statusDescription: "OK",
            headers: {},
            body: configJson
        };

        setHeader(response.headers, {
            key: "Content-Type",
            value: "application/json"
        });

        setHeader(response.headers, {
            key: "Cache-Control",
            value: "public, max-age=31536000"
        });

        return response;
    } catch (e) {
        console.error(e);
        throw e;
    }
});

function loadConfigJson(event: CloudFrontRequestEvent) {
    return new Promise<string>((resolve, reject) => {
        let dataString = "";

        // Retrieve domain of the CloudFront distribution.
        const domain = event.Records[0].cf.config.distributionDomainName;

        const req = get(
            {
                hostname: domain,
                port: 443,
                // TODO: we will call WCP instead of a static file here
                path: "/_config.json"
            },
            function (res) {
                res.on("data", chunk => {
                    dataString += chunk;
                });
                res.on("end", () => {
                    resolve(dataString);
                });
            }
        );

        req.on("error", e => {
            reject({
                statusCode: 500,
                body: e.message
            });
        });
    });
}
