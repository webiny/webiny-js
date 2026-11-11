import { createClient } from "@redis/client";
import type { RedisClientType } from "@redis/client";
import type { Logger } from "@webiny/api-core/features/logger/abstractions.js";
import type { WebsocketsMessageBus } from "@webiny/api-websockets-standalone";

const CHANNEL_PREFIX = "webiny:websockets:";

const channelFor = (owner: string): string => {
    return `${CHANNEL_PREFIX}${owner}`;
};

// A client that never connected is still trying; it is dropped, not waited for.
const closeClient = async (client: RedisClientType): Promise<void> => {
    if (client.isReady) {
        await client.close();
        return;
    }
    if (client.isOpen) {
        client.destroy();
    }
};

export interface IRedisMessageBusParams {
    url: string;
    logger: Logger.Interface;
}

/**
 * Carries websocket messages between API processes through Redis or Valkey pub/sub. Each process
 * subscribes to `webiny:websockets:<owner id>`, and other processes publish to it.
 *
 * Two connections, because a Redis connection that subscribes can do nothing else. The client
 * reconnects on its own and subscribes again after a reconnect. Nothing here waits for Redis: boot
 * does not block on it, and a publish while it is unreachable fails at once, so the request that sent
 * the message is not held up. That message is lost, as it would be if the receiving process were
 * restarting.
 */
export class RedisMessageBus implements WebsocketsMessageBus.Interface {
    private readonly publisher: RedisClientType;
    private readonly subscriber: RedisClientType;
    private readonly logger: Logger.Interface;

    public constructor(params: IRedisMessageBusParams) {
        this.logger = params.logger;
        this.publisher = createClient({ url: params.url, disableOfflineQueue: true });
        this.subscriber = createClient({ url: params.url });

        // Without a listener, a connection error ends the process.
        this.publisher.on("error", error => {
            this.logger.warn({ error }, "[websockets] Redis publisher connection error");
        });
        this.subscriber.on("error", error => {
            this.logger.warn({ error }, "[websockets] Redis subscriber connection error");
        });
    }

    public async publish(owner: string, message: WebsocketsMessageBus.Message): Promise<void> {
        if (!this.publisher.isReady) {
            throw new Error("Redis is not connected.");
        }
        const channel = channelFor(owner);
        const payload = JSON.stringify(message);
        await this.publisher.publish(channel, payload);
    }

    public async subscribe(owner: string, handler: WebsocketsMessageBus.Handler): Promise<void> {
        const channel = channelFor(owner);
        const listener = (payload: string): void => {
            void this.receive(payload, handler);
        };

        this.connect(this.publisher);
        this.connect(this.subscriber);
        // Queued until the subscriber connects, and sent again after every reconnect.
        this.subscriber.subscribe(channel, listener).catch(error => {
            this.logger.error({ error, channel }, "[websockets] could not subscribe to Redis");
        });
    }

    public async close(): Promise<void> {
        const publisherClosing = closeClient(this.publisher);
        const subscriberClosing = closeClient(this.subscriber);
        await Promise.allSettled([publisherClosing, subscriberClosing]);
    }

    private connect(client: RedisClientType): void {
        client.connect().catch(error => {
            this.logger.error({ error }, "[websockets] could not connect to Redis");
        });
    }

    private async receive(payload: string, handler: WebsocketsMessageBus.Handler): Promise<void> {
        try {
            const message: WebsocketsMessageBus.Message = JSON.parse(payload);
            await handler(message);
        } catch (error) {
            this.logger.error({ error }, "[websockets] could not handle a message from Redis");
        }
    }
}
