import { createFeature } from "@webiny/feature/api";
import { UpdatePageWithoutGlobalComponents } from "./decorators/UpdatePageWithoutGlobalComponents.js";
import { CreatePageWithoutGlobalComponents } from "./decorators/CreatePageWithoutGlobalComponents.js";

export const PageGlobalComponentsFeature = createFeature({
    name: "WebsiteBuilder/PageGlobalComponents",
    register(container) {
        container.registerDecorator(UpdatePageWithoutGlobalComponents);
        container.registerDecorator(CreatePageWithoutGlobalComponents);
    }
});
