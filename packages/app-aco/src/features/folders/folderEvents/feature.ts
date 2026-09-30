import { createFeature } from "@webiny/feature/admin";
import { GetFolderGqlGateway } from "~/features/folders/getFolder/GetFolderGqlGateway.js";
import { FolderModelProviderFeature } from "~/features/folders/folderModelProvider/feature.js";
import { AddCreatedFolderToCache } from "./AddCreatedFolderToCache.js";
import { FolderWebsocketMessages } from "./FolderWebsocketMessages.js";

/**
 * Keeps folder caches current when folders change on the server. Registered once, in the container
 * the websocket bridge publishes from, because the news can arrive while no folder view is open.
 *
 * Registers its own folder model provider. The one `FolderModelProviderModule` registers lives in a
 * child of this container, and a container only looks up to its parents, so the gateway below could
 * not reach it. The model is fetched on the first event, not at startup.
 */
export const FolderEventsFeature = createFeature({
    name: "Aco/FolderEvents",
    register(container) {
        FolderModelProviderFeature.register(container);
        container.register(GetFolderGqlGateway);
        container.register(AddCreatedFolderToCache);
        container.register(FolderWebsocketMessages);
    }
});
