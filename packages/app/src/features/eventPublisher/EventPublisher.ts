import type { Container } from "@webiny/di";
import { EventPublisher as Abstraction, BaseEvent } from "./abstractions.js";
import { EnvConfig } from "~/features/envConfig/index.js";

export class EventPublisher implements Abstraction.Interface {
    constructor(private container: Container) {}

    async publish<TEvent extends BaseEvent>(event: TEvent): Promise<void> {
        this.logEvent(event);
        // Get handler abstraction from the event itself
        const handlerAbstraction = event.getHandlerAbstraction();

        // Resolve ALL implementations of that abstraction
        const handlers = this.container.resolveAll(handlerAbstraction);

        // Execute all handlers
        for (const handler of handlers) {
            await handler.handle(event);
        }
    }

    private logEvent(event: BaseEvent) {
        const envConfig = this.container.resolve(EnvConfig);
        if (envConfig.get("debug")) {
            console.log(`[EventPublisher] Publishing event "${event.eventType}".`, event.payload);
        }
    }
}
