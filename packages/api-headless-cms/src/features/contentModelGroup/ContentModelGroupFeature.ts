import { createFeature } from "@webiny/feature/api";
import { GetGroupFeature } from "~/features/contentModelGroup/GetGroup/feature.js";
import { ListGroupsFeature } from "~/features/contentModelGroup/ListGroups/feature.js";
import { CreateGroupFeature } from "~/features/contentModelGroup/CreateGroup/feature.js";
import { UpdateGroupFeature } from "~/features/contentModelGroup/UpdateGroup/feature.js";
import { DeleteGroupFeature } from "~/features/contentModelGroup/DeleteGroup/feature.js";
import { GroupCache } from "~/features/contentModelGroup/shared/abstractions.js";
import { PluginGroupsProvider } from "~/features/contentModelGroup/shared/PluginGroupsProvider.js";
import { createMemoryCache } from "~/utils/index.js";

export const ContentModelGroupFeature = createFeature({
    name: "ContentModelGroup",
    register(container) {
        // Shared infrastructure (singletons)
        container.registerInstance(GroupCache, createMemoryCache());
        container.register(PluginGroupsProvider).inSingletonScope();

        // Query features
        GetGroupFeature.register(container);
        ListGroupsFeature.register(container);

        // Command features
        CreateGroupFeature.register(container);
        UpdateGroupFeature.register(container);
        DeleteGroupFeature.register(container);
    }
});
