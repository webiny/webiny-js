import React, { useEffect, useRef } from "react";
import { useFeature } from "@webiny/app";
import { Messenger, MessageOrigin } from "@webiny/website-builder-sdk";
import { usePreviewDomain } from "@webiny/app-website-builder/BaseEditor/defaultConfig/Content/usePreviewDomain.js";
import { useBreakpoint } from "@webiny/app-website-builder/BaseEditor/hooks/useBreakpoint.js";
import { ComponentEditorFeature } from "../feature.js";

interface SandboxIframeProps {
    reloadKey: number;
    backgroundClass: string;
}

export const SandboxIframe = ({ reloadKey, backgroundClass }: SandboxIframeProps) => {
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const { previewEvents } = useFeature(ComponentEditorFeature);
    const { previewDomain } = usePreviewDomain();
    const { breakpoint } = useBreakpoint();

    const iframeUrl =
        previewDomain && previewDomain.length > 0
            ? `${previewDomain}/sandbox/component?wb.editing=true&wb.referrer=${encodeURIComponent(window.location.origin)}&wb.type=page&wb.id=sandbox&wb.path=/sandbox/component`
            : null;

    const previewOrigin =
        previewDomain && previewDomain.length > 0 ? new URL(previewDomain).origin : "";

    useEffect(() => {
        if (!iframeUrl || !previewOrigin) {
            return;
        }

        const iframe = iframeRef.current;
        if (!iframe) {
            return;
        }

        const editorOrigin = new MessageOrigin(() => window, window.location.origin);
        const previewTarget = new MessageOrigin(() => iframe.contentWindow!, previewOrigin);
        const messenger = new Messenger(editorOrigin, previewTarget, "wb.editor.*");

        messenger.on("preview.ready", () => {
            previewEvents.onConnected(messenger);
        });

        return () => {
            messenger.dispose();
        };
    }, [iframeUrl, previewOrigin, previewEvents, reloadKey]);

    if (!iframeUrl) {
        return (
            <div className="flex items-center justify-center h-full text-neutral-strong">
                Loading preview...
            </div>
        );
    }

    return (
        <div className={`flex-1 min-h-0 p-lg flex justify-center h-full ${backgroundClass}`}>
            <iframe
                key={reloadKey}
                ref={iframeRef}
                src={iframeUrl}
                sandbox="allow-scripts allow-same-origin allow-popups allow-modals allow-forms"
                style={{
                    width: breakpoint.maxWidth ? `${breakpoint.maxWidth}px` : "100%",
                    maxWidth: "100%",
                    height: "100%",
                    border: "none",
                    transition: "width 0.3s ease"
                }}
                title="Component Sandbox Preview"
            />
        </div>
    );
};
