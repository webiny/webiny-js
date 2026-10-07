import { createFeature } from "@webiny/feature/api";
import { WebsiteBuilderStarterKits } from "./WebsiteBuilderStarterKits.js";

export const WbStarterKitsFeature = createFeature({
    name: "WebsiteBuilder/StarterKits",
    register(container) {
        container.registerDecorator(WebsiteBuilderStarterKits);
    }
});
