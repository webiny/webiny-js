import React, { useCallback, useRef } from "react";
import { observer } from "mobx-react-lite";
import { useDrop } from "react-dnd";
import styled from "@emotion/styled";

import { usePreviewData } from "~/BaseEditor/hooks/usePreviewData.js";
import { useSelectFromEditor } from "~/BaseEditor/hooks/useSelectFromEditor.js";
import { ElementOverlay } from "./ElementOverlay.js";
import { useIsDragging } from "../useIsDragging.js";
import type { Box } from "../Box.js";
import type { DropEvent } from "../useProximityDropzone.js";
import { useDocumentEditor } from "~/DocumentEditor/index.js";
import { ElementDropLines } from "./ElementDropLines.js";
import { DropBox } from "./DropBox.js";
import { useDropZoneManager } from "../DropZoneManagerProvider.js";
import { mergeRefs } from "../mergeRefs.js";
import { EditorConfig } from "~/BaseEditor/index.js";
import { dropElement } from "./dropElement.js";
import { ElementOverlayProvider } from "~/BaseEditor/defaultConfig/Content/Preview/Overlays/ElementOverlayProvider.js";

const OverlayContainer = styled("div")({
    overflow: "hidden",
    position: "absolute",
    zIndex: 20
});

const filterElements = (box: Box) => {
    return box.type === "element" && box.id !== "root";
};

const filterSlots = (box: Box) => {
    return box.type === "element-slot";
};

export const ElementOverlays = observer(() => {
    const dropzoneManager = useDropZoneManager();
    const editor = useDocumentEditor();
    const { boxes } = usePreviewData();
    const isDragging = useIsDragging();
    const { selectedElement, highlightedElement } = useSelectFromEditor(state => {
        return {
            selectedElement: state.selectedElement,
            highlightedElement: state.highlightedElement
        };
    });

    const dropRef = useRef<HTMLElement | null>(null);

    const [, drop] = useDrop(() => ({
        accept: "ELEMENT",
        drop: (item: any) => {
            // Match the drop line at the pointer's final position: the manager only matches once per
            // frame, so a quick drop could otherwise land at a line the pointer passed on its way.
            dropzoneManager.tick();
            const target = dropzoneManager.getLastMatchedPosition();
            if (target) {
                onDrop({ item, target });
            }
        }
    }));

    drop(dropRef);

    const onDrop = useCallback((event: DropEvent) => dropElement(editor, event), [editor]);

    const viewportContainer: React.CSSProperties = {
        display: "block",
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        pointerEvents: isDragging ? "auto" : "none"
    };

    const slots = boxes.preview.filter(filterSlots);

    return (
        <OverlayContainer ref={mergeRefs(dropRef)} style={viewportContainer}>
            {boxes.preview.filter(filterElements).map(box => (
                <ElementOverlayProvider
                    key={box.id}
                    elementId={box.id}
                    isSelected={selectedElement === box.id}
                    isHighlighted={highlightedElement === box.id}
                    box={box}
                >
                    <ElementOverlay />
                    <ElementDropLines
                        isFirst={box.parentIndex === 0}
                        previewBox={box}
                        editorBox={boxes.editor.get(box.id)!}
                    />
                    <EditorConfig.ElementOverlay.Elements />
                </ElementOverlayProvider>
            ))}
            {slots.map(slot => (
                <DropBox key={slot.id} box={slot} onDrop={onDrop} />
            ))}
        </OverlayContainer>
    );
});
