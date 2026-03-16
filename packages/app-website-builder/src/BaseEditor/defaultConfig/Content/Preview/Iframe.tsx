import React, { useEffect, useMemo, useRef } from "react";
import type { Messenger } from "@webiny/website-builder-sdk";
import { cn, OverlayLoader } from "@webiny/admin-ui";
import type { ViewportManager } from "@webiny/website-builder-sdk";
import { observer } from "mobx-react-lite";
import { ElementOverlays } from "./Overlays/ElementOverlays.js";
import { ConnectEditorToPreview } from "~/DocumentEditor/ConnectEditorToPreview.js";
import { useResponsiveContainer } from "~/BaseEditor/defaultConfig/Content/Preview/useResponsiveContainer.js";
import { usePreviewData } from "~/BaseEditor/hooks/usePreviewData.js";
import { useSelectFromEditor } from "~/BaseEditor/hooks/useSelectFromEditor.js";
import { PreviewContainer } from "./PreviewContainer.js";

interface IframeProps {
    url: string;
    timestamp: number;
    showLoading: boolean;
    viewportManager: ViewportManager;
    onConnected: (messenger: Messenger) => void;
}

export const Iframe = observer(({ url, timestamp, ...props }: IframeProps) => {
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const previewBodyRef = useRef<HTMLDivElement>(null);
    const previewWidth = useResponsiveContainer(props.viewportManager);
    const { viewport } = usePreviewData();
    const editor = useSelectFromEditor(state => ({
        isReadOnly: state.isReadOnly,
        reservedHeight: state.uiReservedSpace.height
    }));

    const isReadOnly = editor.isReadOnly;

    // When preview width changes, we need to force calculation of the iframe scrollHeight
    // by reducing the height of its parent div to the current viewport height.
    // Otherwise, the iframe grows to fill the parent div, and will not report the correct content height.
    useEffect(() => {
        if (previewBodyRef.current) {
            const minHeight = `calc(100vh - ${editor.reservedHeight}px)`;
            previewBodyRef.current.style.minHeight = minHeight;
        }
    }, [previewWidth]);

    const iframeUrl = useMemo(() => {
        const localUrl = new URL(url);
        localUrl.searchParams.set("wb.ts", timestamp.toString());
        return localUrl.toString();
    }, [url, timestamp]);

    return (
        <PreviewContainer key={iframeUrl}>
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
                ref={previewBodyRef}
                className={
                    "outline outline-neutral-dimmed shadow-sm transition-[width] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] "
                }
                style={{
                    position: "relative",
                    width: `${previewWidth}px`,
                    minHeight: `${viewport.scrollHeight}px`
                }}
            >
                {!isReadOnly ? <ElementOverlays /> : null}
                <iframe
                    scrolling="no"
                    id={"preview-iframe"}
                    className={cn(
                        "absolute block top-0 left-0 w-full w-h-full bg-white border-none min-h-[inherit]",
                        isReadOnly ? "pointer-events-auto" : "pointer-events-none"
                    )}
                    src={iframeUrl}
                    ref={iframeRef}
                    sandbox="allow-scripts allow-pointer-lock allow-same-origin allow-popups allow-modals allow-forms"
                />
            </div>
        </PreviewContainer>
    );
});

Iframe.displayName = "Iframe";
