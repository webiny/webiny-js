import { createFeature } from "@webiny/feature/api";
import { Container } from "@webiny/di-container";
import { EventPublisher as EventPublisherAbstraction } from "./abstractions.js";
import { EventPublisher } from "./EventPublisher.js";

export const EventPublisherFeature = createFeature({
    name: "EventPublisher",
    register(container: Container) {
        container.registerInstance(EventPublisherAbstraction, new EventPublisher(container));
    }
});
