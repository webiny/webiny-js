import { useMemo } from "react";
import { useContainer } from "@webiny/app";
import { useToast } from "@webiny/admin-ui";
import { WebsocketEventHandler } from "@webiny/app-websockets";

const FILE_ENRICHMENT_ACTION = "fm.file.enrichment";

/**
 * UI adapter for the AI image enrichment event. Registers a `WebsocketEventHandler` instance that
 * shows a success toast when enrichment completes. It lives in React (rather than a DI class)
 * because showing a toast needs the `useToast` hook — but it still reacts via the EventPublisher,
 * not by subscribing to the websocket service directly.
 */
export const AiEnrichmentNotifications = () => {
    const container = useContainer();
    const { showSuccessToast } = useToast();

    useMemo(() => {
        container.registerInstance(WebsocketEventHandler, {
            async handle(event) {
                if (event.payload.action !== FILE_ENRICHMENT_ACTION) {
                    return;
                }
                showSuccessToast({
                    title: "Image enriched",
                    description: "AI-generated tags and description have been added."
                });
            }
        });
        // Registered once per container; `showSuccessToast` only proxies to the global toaster.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [container]);

    return null;
};
