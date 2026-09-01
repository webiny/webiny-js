import { ServiceDiscovery } from "@webiny/api-core/features/serviceDiscovery/ServiceDiscovery.js";
import type { FastifyRequest } from "fastify";

export const resolveServerUrl = async (request: FastifyRequest): Promise<string> => {
    const manifest = await ServiceDiscovery.load();
    const domain = manifest?.api?.cloudfront?.domain;
    if (domain) {
        return domain as string;
    }

    return `${request.protocol}://${request.hostname}`;
};
