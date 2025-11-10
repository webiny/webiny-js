import { createFeature } from "@webiny/feature/api";
import { CreateEntryFeature } from "./CreateEntry/feature.js";
import { UpdateEntryFeature } from "./UpdateEntry/feature.js";
import { GetRevisionByIdFeature } from "./GetRevisionById/feature.js";

export const ContentEntriesFeature = createFeature({
    name: "ContentEntries",
    register(container) {
        // Query features
        GetRevisionByIdFeature.register(container);

        // Command features
        CreateEntryFeature.register(container);
        UpdateEntryFeature.register(container);
    }
});
