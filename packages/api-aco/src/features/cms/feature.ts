import { createFeature } from "@webiny/feature/api";
import { CreateEntryWithFlpDecorator } from "./decorators/CreateEntryWithFlpDecorator.js";
import { CreateEntryRevisionFromWithFlpDecorator } from "./decorators/CreateEntryRevisionFromWithFlpDecorator.js";
import { UpdateEntryWithFlpDecorator } from "./decorators/UpdateEntryWithFlpDecorator.js";
import { DeleteEntryWithFlpDecorator } from "./decorators/DeleteEntryWithFlpDecorator.js";
import { DeleteEntryRevisionWithFlpDecorator } from "./decorators/DeleteEntryRevisionWithFlpDecorator.js";
import { MoveEntryWithFlpDecorator } from "./decorators/MoveEntryWithFlpDecorator.js";
import { GetEntryWithFlpDecorator } from "./decorators/GetEntryWithFlpDecorator.js";
import { GetEntryByIdWithFlpDecorator } from "./decorators/GetEntryByIdWithFlpDecorator.js";
import { GetLatestEntriesByIdsWithFlpDecorator } from "./decorators/GetLatestEntriesByIdsWithFlpDecorator.js";
import { GetPublishedEntriesByIdsWithFlpDecorator } from "./decorators/GetPublishedEntriesByIdsWithFlpDecorator.js";
import { ListLatestEntriesWithFlpDecorator } from "./decorators/ListLatestEntriesWithFlpDecorator.js";
import { ListPublishedEntriesWithFlpDecorator } from "./decorators/ListPublishedEntriesWithFlpDecorator.js";
import { ListDeletedEntriesWithFlpDecorator } from "./decorators/ListDeletedEntriesWithFlpDecorator.js";
import { ListEntriesWithFlpDecorator } from "./decorators/ListEntriesWithFlpDecorator.js";
import { GetRevisionByIdWithFlpDecorator } from "./decorators/GetRevisionByIdWithFlpDecorator.js";
import { GetLatestRevisionByEntryIdWithFlpDecorator } from "./decorators/GetLatestRevisionByEntryIdWithFlpDecorator.js";
import { GetEntriesByIdsWithFlpDecorator } from "./decorators/GetEntriesByIdsWithFlpDecorator.js";
import { GetRevisionsByEntryIdWithFlpDecorator } from "./decorators/GetRevisionsByEntryIdWithFlpDecorator.js";
import { GetUniqueFieldValuesWithFlpDecorator } from "./decorators/GetUniqueFieldValuesWithFlpDecorator.js";
import { PublishEntryWithFlpDecorator } from "./decorators/PublishEntryWithFlpDecorator.js";
import { UnpublishEntryWithFlpDecorator } from "./decorators/UnpublishEntryWithFlpDecorator.js";
import { RepublishEntryWithFlpDecorator } from "./decorators/RepublishEntryWithFlpDecorator.js";
import { RestoreEntryFromBinWithFlpDecorator } from "./decorators/RestoreEntryFromBinWithFlpDecorator.js";
import { UpdateRevisionDescriptionWithFlpDecorator } from "./decorators/UpdateRevisionDescriptionWithFlpDecorator.js";

export const CmsFlpFeature = createFeature({
    name: "Aco/CmsFlp",
    register(container) {
        // Command decorators
        container.registerDecorator(CreateEntryWithFlpDecorator);
        container.registerDecorator(CreateEntryRevisionFromWithFlpDecorator);
        container.registerDecorator(UpdateEntryWithFlpDecorator);
        container.registerDecorator(DeleteEntryWithFlpDecorator);
        container.registerDecorator(DeleteEntryRevisionWithFlpDecorator);
        container.registerDecorator(MoveEntryWithFlpDecorator);
        container.registerDecorator(PublishEntryWithFlpDecorator);
        container.registerDecorator(UnpublishEntryWithFlpDecorator);
        container.registerDecorator(RepublishEntryWithFlpDecorator);
        container.registerDecorator(RestoreEntryFromBinWithFlpDecorator);
        container.registerDecorator(UpdateRevisionDescriptionWithFlpDecorator);

        // Query decorators - single entry
        container.registerDecorator(GetEntryWithFlpDecorator);
        container.registerDecorator(GetEntryByIdWithFlpDecorator);
        // Also covers use cases that load the entry through it (e.g. ValidateEntry, DuplicateEntry).
        container.registerDecorator(GetRevisionByIdWithFlpDecorator);
        container.registerDecorator(GetLatestRevisionByEntryIdWithFlpDecorator);

        // Query decorators - multiple entries
        container.registerDecorator(GetLatestEntriesByIdsWithFlpDecorator);
        container.registerDecorator(GetPublishedEntriesByIdsWithFlpDecorator);
        container.registerDecorator(GetEntriesByIdsWithFlpDecorator);
        container.registerDecorator(GetRevisionsByEntryIdWithFlpDecorator);
        container.registerDecorator(GetUniqueFieldValuesWithFlpDecorator);

        // Query decorators - list entries
        container.registerDecorator(ListEntriesWithFlpDecorator);
        container.registerDecorator(ListLatestEntriesWithFlpDecorator);
        container.registerDecorator(ListPublishedEntriesWithFlpDecorator);
        container.registerDecorator(ListDeletedEntriesWithFlpDecorator);
    }
});
