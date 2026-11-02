import { WebsocketsMessageBus } from "./abstractions.js";

/*
 * The bus for a single process, and the default. Every socket is in this process, so the only
 * listener it can reach is its own. Rows another process wrote, such as this process's predecessor
 * before a restart, name an owner nobody listens for here; those messages are dropped and the rows
 * are left to the heartbeat's stale cleanup.
 */
class InProcessMessageBusImpl implements WebsocketsMessageBus.Interface {
    private readonly handlers = new Map<string, WebsocketsMessageBus.Handler>();

    public async publish(owner: string, message: WebsocketsMessageBus.Message): Promise<void> {
        const handler = this.handlers.get(owner);
        if (!handler) {
            return;
        }
        await handler(message);
    }

    public async subscribe(owner: string, handler: WebsocketsMessageBus.Handler): Promise<void> {
        this.handlers.set(owner, handler);
    }

    public async close(): Promise<void> {
        this.handlers.clear();
    }
}

export { InProcessMessageBusImpl };

export const InProcessMessageBus = WebsocketsMessageBus.createImplementation({
    implementation: InProcessMessageBusImpl,
    dependencies: []
});
