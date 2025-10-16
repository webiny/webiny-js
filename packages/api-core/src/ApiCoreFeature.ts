import { createFeature } from "@webiny/feature/api";
import { Container } from "@webiny/di-container";
import { EventPublisherFeature } from "~/features/eventPublisher/feature.js";

export const ApiCoreFeature = createFeature({
    name: "ApiCore",
    register(container: Container) {
        EventPublisherFeature.register(container);
    }
});
