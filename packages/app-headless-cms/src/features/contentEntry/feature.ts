import { createFeature } from "@webiny/feature/admin";
import { ContentEntriesCacheProviderImplementation } from "./ContentEntriesCacheProvider.js";
import { GetEntryFeature } from "./getEntry/feature.js";
import { ListEntriesFeature } from "./listEntries/feature.js";
import { CreateEntryFeature } from "./createEntry/feature.js";
import { UpdateEntryFeature } from "./updateEntry/feature.js";
import { PublishEntryFeature } from "./publishEntry/feature.js";
import { UnpublishEntryFeature } from "./unpublishEntry/feature.js";
import { DeleteEntryFeature } from "./deleteEntry/feature.js";
import { DeleteEntryRevisionFeature } from "./deleteEntryRevision/feature.js";
import { CreateRevisionFromFeature } from "./createRevisionFrom/feature.js";
import { ListRevisionsFeature } from "./listRevisions/feature.js";
import { UpdateRevisionDescriptionFeature } from "./updateRevisionDescription/feature.js";
import { SingletonEntryFeature } from "./singletonEntry/feature.js";
import { MoveEntryFeature } from "./moveEntry/feature.js";
import { BulkActionFeature } from "./bulkAction/feature.js";
import { CmsTrashBinFeature } from "./trashBin/feature.js";

export const ContentEntryFeature = createFeature({
    name: "CmsContentEntry",
    register(container) {
        container.register(ContentEntriesCacheProviderImplementation).inSingletonScope();

        GetEntryFeature.register(container);
        ListEntriesFeature.register(container);
        CreateEntryFeature.register(container);
        UpdateEntryFeature.register(container);
        PublishEntryFeature.register(container);
        UnpublishEntryFeature.register(container);
        DeleteEntryFeature.register(container);
        DeleteEntryRevisionFeature.register(container);
        CreateRevisionFromFeature.register(container);
        ListRevisionsFeature.register(container);
        UpdateRevisionDescriptionFeature.register(container);
        SingletonEntryFeature.register(container);
        MoveEntryFeature.register(container);
        BulkActionFeature.register(container);
        CmsTrashBinFeature.register(container);
    }
});
