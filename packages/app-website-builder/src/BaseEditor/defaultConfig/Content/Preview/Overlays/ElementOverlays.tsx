import React, { useCallback, useRef } from "react";
import { observer } from "mobx-react-lite";
import { useDrop } from "react-dnd";
import styled from "@emotion/styled";

import type { SlotInput } from "@webiny/website-builder-sdk";
import { ComponentManifestToAstConverter } from "@webiny/website-builder-sdk";
import { findMatchingAstNode } from "@webiny/website-builder-sdk";

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
import { Commands, EditorConfig } from "~/BaseEditor/index.js";
import type { Editor } from "~/editorSdk/Editor.js";
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
            const target = dropzoneManager.getLastMatchedPosition();
            if (target) {
                onDrop({ item, target });
            }
        }
    }));

    drop(dropRef);

    const canDropComponentIntoTarget = (
        editor: Editor,
        componentName: string,
        target: DropEvent["target"]
    ) => {
        // Determine component manifest from drop target.
        const document = editor.getDocumentState().read();
        const { component } = document.elements[target.parentId];
        const componentManifest = editor.getEditorState().read().components[component.name];

        // Find target input using AST.
        const inputsAst = ComponentManifestToAstConverter.convert(componentManifest.inputs ?? []);
        const targetInputNode = findMatchingAstNode(target.slot, inputsAst);

        let canAcceptComponent = targetInputNode !== undefined;
        if (targetInputNode) {
            const slotInput = targetInputNode.input as SlotInput;
            const whitelistedComponents = slotInput.components;
            if (whitelistedComponents && whitelistedComponents.length > 0) {
                canAcceptComponent = whitelistedComponents.includes(componentName);
            }
        }
        return canAcceptComponent;
    };

    const onDrop = useCallback(
        ({ item, target }: DropEvent) => {
            if (!canDropComponentIntoTarget(editor, item.componentName, target)) {
                return;
            }

            if (item.id) {
                // We're moving an existing element.
                editor.executeCommand(Commands.MoveElement, {
                    elementId: item.id,
                    parentId: target.parentId,
                    slot: target.slot,
                    index: target.index
                });
            } else {
                // We're creating a new element.
                editor.executeCommand(Commands.CreateElement, {
                    componentName: item.componentName,
                    parentId: target.parentId,
                    slot: target.slot,
                    index: target.index
                });
            }
        },
        [editor]
    );

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
