import React, { useCallback, useEffect, useMemo, useState } from "react";
import type { Messenger } from "@webiny/website-builder-sdk";
import { ViewportManager } from "@webiny/website-builder-sdk";
import { mouseTracker } from "@webiny/website-builder-sdk";
import { useDocumentEditor } from "~/DocumentEditor";
import { AddressBar } from "./AddressBar";
import { Iframe } from "./Iframe";
import { DropZoneManager } from "./DropZoneManager";
import { DropZoneManagerProvider } from "./DropZoneManagerProvider";
import { KeyboardShortcuts } from "./KeyboardShortcuts";
import { Commands } from "~/BaseEditor";
import { useSelectFromEditor } from "~/BaseEditor/hooks/useSelectFromEditor";
import { AwaitIframeUrl } from "~/BaseEditor/defaultConfig/Content/Preview/AwaitIframeUrl";
import { PreviewEvents } from "~/BaseEditor/defaultConfig/Content/Preview/PreviewEvents";
import { ApplyTheme } from "./ApplyTheme";

export const Preview = () => {
    const editor = useDocumentEditor();
    const [iframeTimestamp, setIframeTimestamp] = useState(Date.now());

    const loadingPreview = useSelectFromEditor(state => state.loadingPreview);

    const viewportManager = useMemo(() => {
        return new ViewportManager();
    }, []);

    const previewEvents = useMemo(() => {
        return new PreviewEvents(editor);
    }, []);

    const dropzoneManager = useMemo(() => {
        return new DropZoneManager(mouseTracker);
    }, [mouseTracker]);

    useEffect(() => {
        // On first mount, show loading.
        editor.updateEditor(state => {
            state.loadingPreview = true;
        });

        const offRefreshPreview = editor.registerCommandHandler(Commands.RefreshPreview, () => {
            setIframeTimestamp(Date.now());

            editor.updateEditor(state => {
                // Unset boxes to remove old overlays.
                state.loadingPreview = true;
                state.boxes = {
                    preview: {},
                    editor: {}
                };
            });
        });

        return () => {
            offRefreshPreview();
        };
    }, []);

    // Start various trackers
    useEffect(() => {
        mouseTracker.start();
        dropzoneManager.start();

        return () => {
            dropzoneManager.stop();
            mouseTracker.stop();
            viewportManager.destroy();
            previewEvents.destroy();
        };
    }, [dropzoneManager, mouseTracker]);

    // Update mouse position while dragging
    useEffect(() => {
        const setMousePositionFromDrag = (e: DragEvent) => {
            mouseTracker.setPosition(e.clientX, e.clientY);
        };

        window.addEventListener("dragover", setMousePositionFromDrag);

        return () => {
            window.removeEventListener("dragover", setMousePositionFromDrag);
        };
    }, []);

    const onConnected = useCallback((messenger: Messenger) => {
        previewEvents.onConnected(messenger);
    }, []);

    return (
        <>
            <DropZoneManagerProvider dropzoneManager={dropzoneManager}>
                <ApplyTheme />
                <AddressBar />
                <AwaitIframeUrl>
                    {({ url }) => (
                        <Iframe
                            url={url}
                            timestamp={iframeTimestamp}
                            viewportManager={viewportManager}
                            onConnected={onConnected}
                            showLoading={loadingPreview}
                        />
                    )}
                </AwaitIframeUrl>
            </DropZoneManagerProvider>
            <KeyboardShortcuts />
        </>
    );
};
