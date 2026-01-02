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

        // Query decorators - single entry
        container.registerDecorator(GetEntryWithFlpDecorator);
        container.registerDecorator(GetEntryByIdWithFlpDecorator);

        // Query decorators - multiple entries
        container.registerDecorator(GetLatestEntriesByIdsWithFlpDecorator);
        container.registerDecorator(GetPublishedEntriesByIdsWithFlpDecorator);

        // Query decorators - list entries
        container.registerDecorator(ListEntriesWithFlpDecorator);
        container.registerDecorator(ListLatestEntriesWithFlpDecorator);
        container.registerDecorator(ListPublishedEntriesWithFlpDecorator);
        container.registerDecorator(ListDeletedEntriesWithFlpDecorator);
    }
});
