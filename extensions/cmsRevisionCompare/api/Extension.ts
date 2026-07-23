import { createFeature } from "webiny/api";
import CompareRevisionsSchema from "./graphql/CompareRevisionsSchema.js";
import { CompareRevisionsFeature } from "./features/compareRevisions/feature.js";

export default createFeature({
    name: "CmsRevisionCompare",
    register(container) {
        container.register(CompareRevisionsSchema);
        CompareRevisionsFeature.register(container);
    }
});
