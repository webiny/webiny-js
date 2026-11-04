import { createFeature } from "@webiny/feature/api";
import { WebsiteBuilderPageFolderExistsUseCase } from "./WebsiteBuilderPageFolderExistsUseCase.js";

export const WebsiteBuilderPageFolderExistsFeature = createFeature({
    name: "WebsiteBuilderWorkflows/WebsiteBuilderPageFolderExists",
    register(container) {
        container.register(WebsiteBuilderPageFolderExistsUseCase);
    }
});
