import { ServiceDiscovery } from "@webiny/api-core/features/serviceDiscovery/ServiceDiscovery.js";
import type { Request } from "@webiny/handler/types.js";

export const resolveServerUrl = async (request: Request): Promise<string> => {
    const manifest = await ServiceDiscovery.load();
    const domain = manifest?.api?.cloudfront?.domain;
    if (domain) {
        return domain as string;
    }

    const headers = request.headers ?? {};
    const host = headers["host"] ?? headers["x-forwarded-host"] ?? "localhost";
    const protocol = headers["x-forwarded-proto"] ?? "https";

    return `${protocol}://${host}`;
};
