import React, { useRef, useCallback, useEffect } from "react";
import { EditorBridge } from "@webiny/cms-sdk";
import { usePreviewComponents } from "./PreviewComponentsContext.js";

interface ComponentDiscoveryIframeProps {
    previewUrl: string;
}

export const ComponentDiscoveryIframe = ({ previewUrl }: ComponentDiscoveryIframeProps) => {
    const iframeRef = useRef<HTMLIFrameElement | null>(null);
    const bridgeRef = useRef<EditorBridge | null>(null);
    const { addComponent } = usePreviewComponents();

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

    const iframeSrc = (() => {
        const url = new URL(previewUrl);
        url.searchParams.set("origin", window.location.origin);
        return url.toString();
    })();

    return (
        <iframe
            ref={iframeRef}
            onLoad={onIframeLoad}
            src={iframeSrc}
            style={{ display: "none" }}
            sandbox="allow-same-origin allow-scripts"
        />
    );
};
