import React, { useMemo, useRef } from "react";
import type { Messenger } from "@webiny/website-builder-sdk";
import { OverlayLoader } from "@webiny/admin-ui";
import type { ViewportManager } from "@webiny/website-builder-sdk";
import { observer } from "mobx-react-lite";
import { ElementOverlays } from "./Overlays/ElementOverlays.js";
import { ConnectEditorToPreview } from "~/DocumentEditor/ConnectEditorToPreview.js";
import { useResponsiveContainer } from "~/BaseEditor/defaultConfig/Content/Preview/useResponsiveContainer.js";
import { usePreviewData } from "~/BaseEditor/hooks/usePreviewData.js";

interface IframeProps {
    url: string;
    timestamp: number;
    showLoading: boolean;
    viewportManager: ViewportManager;
    onConnected: (messenger: Messenger) => void;
}

export const Iframe = observer(({ url, timestamp, ...props }: IframeProps) => {
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const previewSize = useResponsiveContainer(props.viewportManager);
    const { viewport } = usePreviewData();

    const iframeUrl = useMemo(() => {
        const localUrl = new URL(url);
        localUrl.searchParams.set("wb.ts", timestamp.toString());
        return localUrl.toString();
    }, [url, timestamp]);

    return (
        <div
            id={"preview-container"}
            key={iframeUrl}
            /* Height = viewport height - top bar - address bar - breadcrumbs. */
            style={{
                height: "calc(100vh - 43px - 50px - 31px)"
            }}
            className={"relative flex flex-col items-center w-full overflow-auto"}
        >
            <ConnectEditorToPreview iframeRef={iframeRef} onConnected={props.onConnected} />
            {props.showLoading ? (
                <OverlayLoader
                    size="lg"
                    variant="accent"
                    text="Loading preview..."
                    className={"bg-neutral-base"}
                />
            ) : null}
            {/* Content wrapper - sized by iframe content */}
            <div
                id={"preview-body"}
                style={{
                    position: "relative",
                    width: previewSize,
                    minHeight: `${viewport.scrollHeight}px`
                }}
            >
                <ElementOverlays />
                <iframe
                    scrolling="no"
                    id={"preview-iframe"}
                    className={
                        "absolute block top-0 left-0 w-full w-h-full bg-white border-none min-h-[inherit] pointer-events-none"
                    }
                    src={iframeUrl}
                    ref={iframeRef}
                    sandbox="allow-scripts allow-pointer-lock allow-same-origin allow-popups allow-modals allow-forms"
                />
            </div>
        </div>
    );
});

Iframe.displayName = "Iframe";
