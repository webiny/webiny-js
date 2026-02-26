import { useCallback, useEffect, useRef } from "react";

export type OnPreviewReady = () => void;

export interface CmsLivePreviewIncomingEvent {
    type: "wby:onPreviewReady";
    data: Record<string, any>;
}

export interface PreviewWindowGetter {
    (): Window | null;
}

function useBaseLivePreview(windowGetter: PreviewWindowGetter) {
    const onPreviewReadyRefs = useRef<OnPreviewReady>();

    const updateLivePreview = useCallback((data: Record<string, any>) => {
        const previewWindow = windowGetter();

        if (!previewWindow) {
            return;
        }

        previewWindow.postMessage({ type: "wby:onChange", data }, "*");
    }, []);

    useEffect(() => {
        window.addEventListener(
            "message",
            function (event: MessageEvent<CmsLivePreviewIncomingEvent>) {
                if (!event.data.type?.startsWith("wby:")) {
                    return;
                }

                if (event.data.type === "wby:onPreviewReady") {
                    if (onPreviewReadyRefs.current) {
                        onPreviewReadyRefs.current();
                    }
                }
            }
        );
    }, []);

    const onPreviewReady = (cb: OnPreviewReady) => {
        onPreviewReadyRefs.current = cb;
    };

    return { updateLivePreview, onPreviewReady };
}

export const useLivePreview = useBaseLivePreview;
