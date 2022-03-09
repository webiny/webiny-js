import { get } from "https";
import { CloudFrontRequest, CloudFrontRequestEvent } from "~/lambdaEdge";

const configTTL = 60 * 1000; // 1 minute
const configPath = "/_config.json";

let configCache: GatewayConfig | undefined;
let configTimestamp = 0;

export interface StageConfig {
    domain: string;
    weight: number;
}

export type GatewayConfig = Record<string, StageConfig>;

export function isConfigRequest(request: CloudFrontRequest) {
    return request.uri === configPath;
}

export async function loadConfig(event: CloudFrontRequestEvent) {
    if (configCache && Date.now() - configTimestamp < configTTL) {
        return Promise.resolve(configCache);
    }

    configCache = await loadConfigCore(event);
    configTimestamp = Date.now();

    return configCache;
}

function loadConfigCore(event: CloudFrontRequestEvent) {
    const domain = event.Records[0].cf.config.distributionDomainName;

    return new Promise<GatewayConfig>((resolve, reject) => {
        let dataString = "";

        const req = get(
            {
                hostname: domain,
                port: 443,
                path: configPath
            },
            function (res) {
                res.on("data", chunk => {
                    dataString += chunk;
                });
                res.on("end", () => {
                    resolve(JSON.parse(dataString));
                });
            }
        );

        req.on("error", e => {
            reject({
                statusCode: 500,
                body: e.message.substring(0, 100)
            });
        });
    });
}
