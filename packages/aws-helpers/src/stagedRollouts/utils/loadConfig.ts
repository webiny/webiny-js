import { get } from "https";
import { CloudFrontRequestEvent } from "~/lambdaEdge";
import { configPath } from "./common";

// Config must be cached per domain.
// Otherwise cache will spill over different apps, because we may share this lambda.
const configCache = new Map<string, GatewayConfigCache>();

interface GatewayConfigCache {
    config: GatewayConfig;
    timestamp: number;
}

export interface StageConfig {
    domain: string;
    weight: number;
}

export type GatewayConfig = Record<string, StageConfig>;

export async function loadConfig(event: CloudFrontRequestEvent) {
    const domain = event.Records[0].cf.config.distributionDomainName;

    let config = configCache.get(domain);
    if (!config || isCacheExpired(config.timestamp)) {
        config = {
            config: await loadConfigCore(domain),
            timestamp: Date.now()
        };

        configCache.set(domain, config);
    }

    return config.config;
}

function loadConfigCore(domain: string) {
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

function isCacheExpired(timestamp: number) {
    const ttl = 60 * 1000; // 1 minute
    return Date.now() - timestamp > ttl;
}
