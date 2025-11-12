import { createFeature } from "@webiny/feature/api";
import { CreateEntryFeature } from "./CreateEntry/feature.js";
import { CreateEntryRevisionFromFeature } from "./CreateEntryRevisionFrom/feature.js";
import { UpdateEntryFeature } from "./UpdateEntry/feature.js";
import { ValidateEntryFeature } from "./ValidateEntry/feature.js";
import { MoveEntryFeature } from "./MoveEntry/feature.js";
import { RepublishEntryFeature } from "./RepublishEntry/feature.js";
import { PublishEntryFeature } from "./PublishEntry/feature.js";
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
import { DeleteMultipleEntriesFeature } from "./DeleteMultipleEntries/feature.js";
import { RestoreEntryFromBinFeature } from "./RestoreEntryFromBin/feature.js";
import { GetLatestRevisionByEntryIdFeature } from "./GetLatestRevisionByEntryId/feature.js";
import { GetPublishedRevisionByEntryIdFeature } from "./GetPublishedRevisionByEntryId/feature.js";
import { UnpublishEntryFeature } from "./UnpublishEntry/feature.js";
import { GetUniqueFieldValuesFeature } from "./GetUniqueFieldValues/feature.js";

export const ContentEntriesFeature = createFeature({
    name: "ContentEntries",
    register(container) {
        // Query features
        GetRevisionByIdFeature.register(container);
        GetEntriesByIdsFeature.register(container);
        GetEntryByIdFeature.register(container);
        GetPublishedEntriesByIdsFeature.register(container);
        GetPublishedRevisionByEntryIdFeature.register(container);
        GetLatestEntriesByIdsFeature.register(container);
        GetLatestRevisionByEntryIdFeature.register(container);
        GetRevisionsByEntryIdFeature.register(container);
        GetPreviousRevisionByEntryIdFeature.register(container);
        GetEntryFeature.register(container);
        ListEntriesFeature.register(container);
        GetUniqueFieldValuesFeature.register(container);

        // Command features
        CreateEntryFeature.register(container);
        CreateEntryRevisionFromFeature.register(container);
        UpdateEntryFeature.register(container);
        ValidateEntryFeature.register(container);
        MoveEntryFeature.register(container);
        PublishEntryFeature.register(container);
        UnpublishEntryFeature.register(container);
        RepublishEntryFeature.register(container);
        DeleteEntryFeature.register(container);
        DeleteEntryRevisionFeature.register(container);
        DeleteMultipleEntriesFeature.register(container);
        RestoreEntryFromBinFeature.register(container);
    }
});
