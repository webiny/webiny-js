import { createFeature } from "@webiny/feature/api";
import { CmsModelFieldToGraphQLRegistry } from "./fields/CmsModelFieldToGraphQLRegistry.js";

export const GraphQLFeature = createFeature({
    name: "Cms/GraphQLFeature",
    register: container => {
        container.register(CmsModelFieldToGraphQLRegistry);
    }
});
