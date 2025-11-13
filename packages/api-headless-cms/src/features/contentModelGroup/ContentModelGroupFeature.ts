import { createFeature } from "@webiny/feature/api";
import { GetGroupFeature } from "~/features/contentModelGroup/GetGroup/feature.js";
import { ListGroupsFeature } from "~/features/contentModelGroup/ListGroups/feature.js";
import { CreateGroupFeature } from "~/features/contentModelGroup/CreateGroup/feature.js";
import { GroupCache } from "~/features/contentModelGroup/shared/GroupCache.js";
import { PluginGroupsProvider } from "~/features/contentModelGroup/shared/PluginGroupsProvider.js";

export const ContentModelGroupFeature = createFeature({
    name: "ContentModelGroup",
    register(container) {
        // Shared infrastructure (singletons)
        container.register(GroupCache).inSingletonScope();
        container.register(PluginGroupsProvider).inSingletonScope();

        // Query features
        GetGroupFeature.register(container);
        ListGroupsFeature.register(container);

        // Command features
        CreateGroupFeature.register(container);
    }
});
