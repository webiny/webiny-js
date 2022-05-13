import { get } from "https";
import { CloudFrontRequestEvent } from "~/lambdaEdge";
import { logDebug } from "./log";

// Config file has a fixed URL within CDN, so it can be properly cached.
// This way we achieve better performance, because CDN does not have to call WCP API for config every time,
// but it can use it's own cache for a lookup.
const configPath = "/_config";

// Config is locally cached within live lambda for a short time (1 minute).
// Config must be cached per domain.
// Otherwise cache will spill over different apps, because we may share this lambda.
const configCache = new Map<string, GatewayConfigCache>();

interface GatewayConfigCache {
    config: GatewayConfig;
    timestamp: number;
}

export interface VariantConfig {
    domain: string;
    weight: number;
}

export type GatewayConfig = Record<string, VariantConfig>;

/**
 * Loads traffic splitting config.
 * It will, however not call WCP directly, but serve it from a locally cached file,
 * as explained here https://www.notion.so/webiny/How-traffic-config-is-cached-2c8db57ca2b547a2b2fb1adf378cd191
 */
export async function loadTrafficSplittingConfig(event: CloudFrontRequestEvent) {
    // Retrieve domain of the CloudFront distribution.
    // We need it to make sure we cache config per application.
    // For example API and website could share the same lambda instance.
    // So we cache it separately for each domain (each CloudFront).
    const domain = event.Records[0].cf.config.distributionDomainName;

    let config = configCache.get(domain);
    if (!config || isCacheExpired(config.timestamp)) {
        logDebug("No config in cache");
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
                body: e.message
            });
        });
    });
}

function isCacheExpired(timestamp: number) {
    const ttl = 60 * 1000; // 1 minute
    return Date.now() - timestamp > ttl;
}
