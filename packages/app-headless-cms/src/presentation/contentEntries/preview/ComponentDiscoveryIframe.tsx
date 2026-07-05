import React, { useRef, useEffect } from "react";
import { Messenger, MessageOrigin } from "@webiny/cms-sdk/messenger";
import { useLivePreviewPresenter } from "./useLivePreviewPresenter.js";

interface ComponentDiscoveryIframeProps {
    previewUrl: string;
}

export const ComponentDiscoveryIframe = ({ previewUrl }: ComponentDiscoveryIframeProps) => {
    const iframeRef = useRef<HTMLIFrameElement | null>(null);
    const messengerRef = useRef<Messenger | null>(null);
    const presenter = useLivePreviewPresenter();

    const iframeSrc = (() => {
        const base = previewUrl.endsWith("/") ? previewUrl : previewUrl + "/";
        const url = new URL("new", base);
        url.searchParams.set("origin", window.location.origin);
        return url.toString();
    })();

    useEffect(() => {
        const iframe = iframeRef.current;
        if (!iframe || !iframe.contentWindow) {
            return;
        }

        const targetOrigin = new URL(iframe.src).origin;
        const editorOrigin = new MessageOrigin(() => window, window.location.origin);
        const previewTarget = new MessageOrigin(() => iframe.contentWindow!, targetOrigin);

        const messenger = new Messenger(editorOrigin, previewTarget, "cms.preview.*");
        messengerRef.current = messenger;

        messenger.on("preview.component.register", (manifest: { name: string; label: string; description: string }) => {
            presenter.addComponent(manifest);
        });

        return () => {
            messenger.dispose();
            messengerRef.current = null;
        };
    }, [iframeSrc, presenter]);

    return (
        <iframe
            ref={iframeRef}
            src={iframeSrc}
            style={{ display: "none" }}
            sandbox="allow-same-origin allow-scripts"
        />
    );
};
