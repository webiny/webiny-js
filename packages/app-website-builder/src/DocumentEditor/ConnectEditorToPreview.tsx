import type React from "react";
import { useEffect, useRef } from "react";
import { MessageOrigin, Messenger } from "@webiny/website-builder-sdk";
import type { usePreviewData } from "~/BaseEditor/hooks/usePreviewData.js";

type ConnectEditorToPreviewProps = {
    iframeRef: React.RefObject<HTMLIFrameElement | null>;
    onConnected: (
        messenger: Messenger,
        elementPositionsHook?: ReturnType<typeof usePreviewData>
    ) => void;
};

export function ConnectEditorToPreview({ iframeRef, onConnected }: ConnectEditorToPreviewProps) {
    const messengerRef = useRef<Messenger | null>(null);

    useEffect(() => {
        if (!iframeRef.current?.contentWindow) {
            return;
        }

        const targetWindow = () => iframeRef.current!.contentWindow!;
        const targetOrigin = new URL(iframeRef.current.src).origin;

        const editorOrigin = new MessageOrigin(() => window, window.location.origin);
        const previewTarget = new MessageOrigin(targetWindow, targetOrigin);

        const messenger = new Messenger(editorOrigin, previewTarget, "wb.editor.*");
        messengerRef.current = messenger;

        // Listen for "preview-ready"
        const off = messenger.on("preview.ready", () => {
            onConnected(messenger);
        });

        return () => {
            off(); // Remove listener
            messenger.dispose();
        };
    }, [iframeRef, onConnected]);

    return null;
}
