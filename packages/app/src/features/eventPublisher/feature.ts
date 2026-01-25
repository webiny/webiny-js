import { createFeature } from "@webiny/feature/admin";
import { Container } from "@webiny/di";
import { EventPublisher as EventPublisherAbstraction } from "./abstractions.js";
import { EventPublisher } from "./EventPublisher.js";

export const EventPublisherFeature = createFeature({
    name: "EventPublisher",
    register(container: Container) {
        container.registerInstance(EventPublisherAbstraction, new EventPublisher(container));
    }
});
