import React, { useCallback, useMemo, useState } from "react";
import type { Messenger, ViewportManager } from "@webiny/website-builder-sdk";
import { Iframe } from "./Iframe.js";
import { NoFrontendConnected } from "./NoFrontendConnected.js";
import type { PreviewEvents } from "./PreviewEvents.js";
import { usePreviewConnection } from "./usePreviewConnection.js";

interface PreviewFrameProps {
    url: string;
    timestamp: number;
    showLoading: boolean;
    viewportManager: ViewportManager;
    previewEvents: PreviewEvents;
}

/**
 * Owns everything that belongs to a single load of the preview: the handshake with the frontend,
 * and the resulting connection status. The parent remounts this component on every page load, so
 * the connection state always starts over with the iframe.
 */
export const PreviewFrame = ({ url, timestamp, showLoading, ...props }: PreviewFrameProps) => {
    const [connected, setConnected] = useState(false);
    const { status, retry } = usePreviewConnection({ url, connected });

    const onConnected = useCallback(
        (messenger: Messenger) => {
            setConnected(true);
            props.previewEvents.onConnected(messenger);
        },
        [props.previewEvents]
    );

    const overlay = useMemo(() => {
        if (status !== "unreachable" && status !== "unresponsive") {
            return null;
        }

        return <NoFrontendConnected origin={new URL(url).origin} status={status} onRetry={retry} />;
    }, [status, url, retry]);

    return (
        <Iframe
            url={url}
            timestamp={timestamp}
            viewportManager={props.viewportManager}
            onConnected={onConnected}
            showLoading={showLoading}
            overlay={overlay}
        />
    );
};
