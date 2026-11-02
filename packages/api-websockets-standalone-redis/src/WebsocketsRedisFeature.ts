import { createFeature } from "@webiny/feature/api";
import { WebsocketsMessageBus } from "@webiny/api-websockets-standalone";
import { RedisMessageBus } from "~/RedisMessageBus.js";
import type { IRedisMessageBusParams } from "~/RedisMessageBus.js";

/**
 * Registers the Redis/Valkey message bus in place of the in-process one. Register it in the root
 * container, once per process.
 */
export const WebsocketsRedisFeature = createFeature<IRedisMessageBusParams>({
    name: "WebsocketsRedis",
    register(container, params) {
        const bus = new RedisMessageBus(params);
        container.registerInstance(WebsocketsMessageBus, bus);
    }
});
