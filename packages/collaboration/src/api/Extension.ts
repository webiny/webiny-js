import { createFeature } from "@webiny/feature/api";
import { CollabThreadModel } from "./domain/thread/threadModel.js";
import { CollabThreadMapper } from "./domain/thread/CollabThreadMapper.js";
import { ResolveLocatorFeature } from "./features/locator/ResolveLocator/feature.js";
import { CmsLocatorResolverFeature } from "./features/cms/CmsLocatorResolver/feature.js";
import { GetThreadFeature } from "./features/thread/GetThread/feature.js";
import { UpdateThreadFeature } from "./features/thread/UpdateThread/feature.js";
import { CreateThreadFeature } from "./features/thread/CreateThread/feature.js";
import { ListThreadsFeature } from "./features/thread/ListThreads/feature.js";
import { ReplyToThreadFeature } from "./features/thread/ReplyToThread/feature.js";
import { ResolveThreadFeature } from "./features/thread/ResolveThread/feature.js";
import { ReopenThreadFeature } from "./features/thread/ReopenThread/feature.js";
import { UpdateMessageFeature } from "./features/thread/UpdateMessage/feature.js";
import { DeleteMessageFeature } from "./features/thread/DeleteMessage/feature.js";
import { DeleteThreadFeature } from "./features/thread/DeleteThread/feature.js";
import { CollaborationSchema } from "./graphql/collaboration.js";

export const Extension = createFeature({
    name: "Collaboration",
    register(container) {
        container.register(CollabThreadModel);
        container.register(CollabThreadMapper);

        // Features
        ResolveLocatorFeature.register(container);
        CmsLocatorResolverFeature.register(container);
        UpdateThreadFeature.register(container);
        GetThreadFeature.register(container);
        CreateThreadFeature.register(container);
        ListThreadsFeature.register(container);
        ReplyToThreadFeature.register(container);
        ResolveThreadFeature.register(container);
        ReopenThreadFeature.register(container);
        UpdateMessageFeature.register(container);
        DeleteMessageFeature.register(container);
        DeleteThreadFeature.register(container);

        // GraphQL
        container.register(CollaborationSchema);
    }
});
