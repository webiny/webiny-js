import { createFeature } from "@webiny/feature/api";
import { CreateEntryFeature } from "./CreateEntry/feature.js";
import { UpdateEntryFeature } from "./UpdateEntry/feature.js";
import { GetRevisionByIdFeature } from "./GetRevisionById/feature.js";
import { ListEntriesFeature } from "./ListEntries/feature.js";
import { GetEntriesByIdsFeature } from "./GetEntriesByIds/feature.js";
import { GetEntryByIdFeature } from "./GetEntryById/feature.js";
import { GetPublishedEntriesByIdsFeature } from "./GetPublishedEntriesByIds/feature.js";
import { GetLatestEntriesByIdsFeature } from "./GetLatestEntriesByIds/feature.js";
import { GetRevisionsByEntryIdFeature } from "./GetRevisionsByEntryId/feature.js";
import { GetPreviousRevisionByEntryIdFeature } from "./GetPreviousRevisionByEntryId/feature.js";
import { GetEntryFeature } from "./GetEntry/feature.js";
import { DeleteEntryFeature } from "./DeleteEntry/feature.js";
import { DeleteEntryRevisionFeature } from "./DeleteEntryRevision/feature.js";

export const ContentEntriesFeature = createFeature({
    name: "ContentEntries",
    register(container) {
        // Query features
        GetRevisionByIdFeature.register(container);
        GetEntriesByIdsFeature.register(container);
        GetEntryByIdFeature.register(container);
        GetPublishedEntriesByIdsFeature.register(container);
        GetLatestEntriesByIdsFeature.register(container);
        GetRevisionsByEntryIdFeature.register(container);
        GetPreviousRevisionByEntryIdFeature.register(container);
        GetEntryFeature.register(container);
        ListEntriesFeature.register(container);

        // Command features
        CreateEntryFeature.register(container);
        UpdateEntryFeature.register(container);
        DeleteEntryFeature.register(container);
        DeleteEntryRevisionFeature.register(container);
    }
});
