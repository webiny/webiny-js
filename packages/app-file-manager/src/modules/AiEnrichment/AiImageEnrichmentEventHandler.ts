import { WebsocketEventHandler } from "@webiny/app-websockets";
import { Notifications } from "@webiny/app-admin/features/notifications/abstractions.js";
import { FilesListCache } from "~/features/shared/abstractions.js";

const FILE_ENRICHMENT_ACTION = "fm.file.enrichment";

interface FileEnrichmentData {
    id: string;
    tags: string[];
    description: string;
}

/**
 * Reacts to the `fm.file.enrichment` websocket message (published as a `WebsocketEvent`):
 * patches the affected file in the shared list cache with the AI-generated tags and description
 * (cache-only — the data is already persisted server-side), then surfaces a success notification.
 */
class AiImageEnrichmentEventHandlerImpl implements WebsocketEventHandler.Interface {
    constructor(
        private filesListCache: FilesListCache.Interface,
        private notifications: Notifications.Interface
    ) {}

    async handle(event: WebsocketEventHandler.Event): Promise<void> {
        if (event.payload.action !== FILE_ENRICHMENT_ACTION) {
            return;
        }

        const { id, tags, description } = event.payload as unknown as FileEnrichmentData;

        this.filesListCache.updateItems(item =>
            item.id === id ? { ...item, tags, description } : item
        );

        this.notifications.success({
            title: "Image enriched",
            description: "AI-generated tags and description have been added."
        });
    }
}

export const AiImageEnrichmentEventHandler = WebsocketEventHandler.createImplementation({
    implementation: AiImageEnrichmentEventHandlerImpl,
    dependencies: [FilesListCache, Notifications]
});
