import { WebsocketEventHandler } from "@webiny/app-websockets";
import { Notifications } from "@webiny/app-admin/features/notifications/abstractions.js";

const FILE_ENRICHMENT_FAILED_ACTION = "fm.file.enrichment.failed";

interface FileEnrichmentFailedData {
    id: string;
    message: string;
}

/**
 * Reacts to the `fm.file.enrichment.failed` websocket message, which the upload-time enrichment
 * task sends when it fails for a reason someone has to fix (no Vision model, a missing key, the
 * provider rejecting the request). Switched off and non-image uploads never send it.
 *
 * Without this the failure only reached the API log, and from the File Manager it looked exactly
 * like enrichment never having run.
 */
class AiImageEnrichmentFailedEventHandlerImpl implements WebsocketEventHandler.Interface {
    constructor(private notifications: Notifications.Interface) {}

    async handle(event: WebsocketEventHandler.Event): Promise<void> {
        if (event.payload.action !== FILE_ENRICHMENT_FAILED_ACTION) {
            return;
        }

        const { message } = (event.payload as unknown as { data: FileEnrichmentFailedData }).data;

        this.notifications.warning({
            title: "Image enrichment failed",
            description: message
        });
    }
}

export const AiImageEnrichmentFailedEventHandler = WebsocketEventHandler.createImplementation({
    implementation: AiImageEnrichmentFailedEventHandlerImpl,
    dependencies: [Notifications]
});
