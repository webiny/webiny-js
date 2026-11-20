import { createFeature } from "@webiny/feature/api";
import { ListPageGlobalComponentsUseCase } from "./ListPageGlobalComponentsUseCase.js";

export const ListPageGlobalComponentsFeature = createFeature({
    name: "WebsiteBuilder/ListPageGlobalComponents",
    register(container) {
        container.register(ListPageGlobalComponentsUseCase);
    }
});
