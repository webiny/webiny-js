import { createFeature } from "@webiny/feature/api";
import { CreateEntryDataFactoryFeature } from "./CreateEntryDataFactory/feature.js";
import { UpdateEntryDataFactoryFeature } from "./UpdateEntryDataFactory/feature.js";
import { CreateEntryRevisionFromDataFactoryFeature } from "./CreateEntryRevisionFromDataFactory/feature.js";
import { CreatePublishEntryDataFactoryFeature } from "./CreatePublishEntryDataFactory/feature.js";
import { CreateUnpublishEntryDataFactoryFeature } from "./CreateUnpublishEntryDataFactory/feature.js";
import { CreateRepublishEntryDataFactoryFeature } from "./CreateRepublishEntryDataFactory/feature.js";

export const EntryDataFactoriesFeature = createFeature({
    name: "EntryDataFactories",
    register(container) {
        CreateEntryDataFactoryFeature.register(container);
        UpdateEntryDataFactoryFeature.register(container);
        CreateEntryRevisionFromDataFactoryFeature.register(container);
        CreatePublishEntryDataFactoryFeature.register(container);
        CreateUnpublishEntryDataFactoryFeature.register(container);
        CreateRepublishEntryDataFactoryFeature.register(container);
    }
});
