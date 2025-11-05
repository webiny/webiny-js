import React, { useCallback, useEffect, useMemo, useState } from "react";
import type { Messenger } from "@webiny/website-builder-sdk";
import { useDocumentEditor } from "~/DocumentEditor/index.js";
import { AddressBar } from "./AddressBar.js";
import { Iframe } from "./Iframe.js";
import { HoverManager } from "./HoverManager.js";
import { DropZoneManager } from "./DropZoneManager.js";
import { DropZoneManagerProvider } from "./DropZoneManagerProvider.js";
import { Boxes } from "~/BaseEditor/hooks/Boxes.js";
import { ScrollTracker } from "~/BaseEditor/defaultConfig/Content/Preview/ScrollTracker.js";
import { KeyboardShortcuts } from "./KeyboardShortcuts.js";
import { ViewportManager } from "@webiny/website-builder-sdk";
import { mouseTracker } from "@webiny/website-builder-sdk";
import { Commands } from "~/BaseEditor/index.js";
import { useSelectFromEditor } from "~/BaseEditor/hooks/useSelectFromEditor.js";
import { AwaitIframeUrl } from "~/BaseEditor/defaultConfig/Content/Preview/AwaitIframeUrl.js";
import { PreviewEvents } from "~/BaseEditor/defaultConfig/Content/Preview/PreviewEvents.js";
import { ApplyTheme } from "./ApplyTheme.js";

export const Preview = () => {
    const editor = useDocumentEditor();
    const [iframeTimestamp, setIframeTimestamp] = useState(Date.now());

    const loadingPreview = useSelectFromEditor(state => state.loadingPreview);

    const scrollTracker = useMemo(() => {
        return new ScrollTracker(window, e => {
            const source = e.target as HTMLDivElement | null;

            if (!source) {
                return false;
            }

            return true;
        });
    }, []);

    const hoverManager = useMemo(() => {
        return new HoverManager(mouseTracker, () => {
            const editorState = editor.getEditorState().read();
            return new Boxes(editorState.boxes.editor).filter(box => box.id !== "root");
        });
    }, [mouseTracker]);

    const viewportManager = useMemo(() => {
        return new ViewportManager();
    }, []);

    const previewEvents = useMemo(() => {
        return new PreviewEvents(editor, scrollTracker);
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
        scrollTracker.start();
        mouseTracker.start();
        dropzoneManager.start();

        return () => {
            dropzoneManager.stop();
            mouseTracker.stop();
            scrollTracker.destroy();
            viewportManager.destroy();
            hoverManager.destroy();
            previewEvents.destroy();
        };
    }, [dropzoneManager, scrollTracker, mouseTracker]);

    // Update mouse position while dragging
    useEffect(() => {
        const setMousePositionFromDrag = (e: DragEvent) => {
            mouseTracker.setPosition(e.clientX, e.clientY);
        };

        window.addEventListener("dragover", setMousePositionFromDrag);

        const offHoverChange = hoverManager.onHoverChange(id => {
            editor.updateEditor(state => {
                state.highlightedElement = id;
            });
        });

        return () => {
            window.removeEventListener("dragover", setMousePositionFromDrag);
            offHoverChange();
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
