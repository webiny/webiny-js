import type { Container } from "@webiny/di";
import { EventPublisher as Abstraction, DomainEvent } from "./abstractions.js";

export class EventPublisher implements Abstraction.Interface {
    constructor(private container: Container) {}

    async publish<TEvent extends DomainEvent>(event: TEvent): Promise<void> {
        // Get handler abstraction from the event itself
        const handlerAbstraction = event.getHandlerAbstraction();

        // Resolve ALL implementations of that abstraction
        const handlers = this.container.resolveAll(handlerAbstraction);

        // Execute all handlers
        for (const handler of handlers) {
            await handler.handle(event);
        }
    }
}
