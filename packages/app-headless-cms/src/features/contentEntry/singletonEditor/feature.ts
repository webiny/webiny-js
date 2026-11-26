import { createFeature } from "@webiny/feature/admin";
import { GetLatestSingletonEntryFeature } from "./getLatest/feature.js";
import { GetSingletonEntryRevisionFeature } from "./getRevision/feature.js";

export const SingletonEditorFeature = createFeature({
    name: "CmsContentEntry/SingletonEditor",
    register(container) {
        GetLatestSingletonEntryFeature.register(container);
        GetSingletonEntryRevisionFeature.register(container);
    }
});
