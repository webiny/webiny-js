import { WebsocketEventHandler } from "@webiny/app-websockets";
import { FilesListCache } from "~/features/shared/abstractions.js";

const FILE_ENRICHMENT_ACTION = "fm.file.enrichment";

interface FileEnrichmentData {
    id: string;
    tags: string[];
    description: string;
}

/**
 * Reacts to the `fm.file.enrichment` websocket message (published as a `WebsocketEvent`) and
 * patches the affected file in the shared list cache with the AI-generated tags and description.
 * The data is already persisted server-side by the enrichment task, so this is a cache-only
 * update — no GraphQL mutation is issued.
 */
class AiImageEnrichmentEventHandlerImpl implements WebsocketEventHandler.Interface {
    constructor(private filesListCache: FilesListCache.Interface) {}

    async handle(event: WebsocketEventHandler.Event): Promise<void> {
        if (event.payload.action !== FILE_ENRICHMENT_ACTION) {
            return;
        }

        const { id, tags, description } = event.payload as unknown as FileEnrichmentData;

        this.filesListCache.updateItems(item =>
            item.id === id ? { ...item, tags, description } : item
        );
    }
}

export const AiImageEnrichmentEventHandler = WebsocketEventHandler.createImplementation({
    implementation: AiImageEnrichmentEventHandlerImpl,
    dependencies: [FilesListCache]
});
