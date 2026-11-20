import { createFeature } from "@webiny/feature/api";
import { CreatePageWithDefaultLayout } from "./decorators/CreatePageWithDefaultLayout.js";

export const PageDefaultLayoutFeature = createFeature({
    name: "WebsiteBuilder/PageDefaultLayout",
    register(container) {
        container.registerDecorator(CreatePageWithDefaultLayout);
    }
});
