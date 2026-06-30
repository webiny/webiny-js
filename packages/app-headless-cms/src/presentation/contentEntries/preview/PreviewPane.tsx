import React, { useRef, useEffect, useCallback, useState } from "react";
import { EditorBridge } from "@webiny/cms-sdk";
import { usePreviewComponents } from "./PreviewComponentsContext.js";

interface PreviewPaneProps {
    previewUrl: string;
    entryData: Record<string, unknown> | null;
}

export const PreviewPane = ({ previewUrl, entryData }: PreviewPaneProps) => {
    const iframeRef = useRef<HTMLIFrameElement | null>(null);
    const bridgeRef = useRef<EditorBridge | null>(null);
    const [ready, setReady] = useState(false);
    const { addComponent } = usePreviewComponents();

    const getIframeSrc = useCallback(() => {
        const url = new URL(previewUrl);
        url.searchParams.set("origin", window.location.origin);
        return url.toString();
    }, [previewUrl]);

    const onIframeLoad = useCallback(() => {
        const iframe = iframeRef.current;
        if (!iframe) {
            return;
        }

        if (bridgeRef.current) {
            bridgeRef.current.dispose();
        }

        const bridge = new EditorBridge(iframe);
        bridgeRef.current = bridge;

        bridge.onReady(() => setReady(true));
        bridge.onComponentRegister(manifest => addComponent(manifest));
    }, [addComponent]);

    useEffect(() => {
        return () => {
            if (bridgeRef.current) {
                bridgeRef.current.dispose();
                bridgeRef.current = null;
            }
        };
    }, []);

    useEffect(() => {
        if (!ready || !entryData || !bridgeRef.current) {
            return;
        }
        bridgeRef.current.sendEntryUpdate(entryData);
    }, [ready, entryData]);

    return (
        <div className="flex flex-col h-full border border-neutral-dimmed rounded-lg overflow-hidden">
            <iframe
                ref={iframeRef}
                onLoad={onIframeLoad}
                src={getIframeSrc()}
                className="w-full h-full"
                sandbox="allow-same-origin allow-scripts allow-forms"
            />
        </div>
    );
};
