import React, { useMemo } from "react";
import { useDragLayer } from "react-dnd";
import { DropLine } from "./DropLine.js";
import { useIsDragging } from "../useIsDragging.js";
import { useProximityDropzone } from "../useProximityDropzone.js";
import type { Box } from "../Box.js";
import { useElementComponentManifest } from "~/BaseEditor/defaultConfig/Content/Preview/useElementComponentManifest.js";
import { ComponentManifestToAstConverter } from "@webiny/website-builder-sdk";
import { findMatchingAstNode } from "@webiny/website-builder-sdk";
import type { SlotInput } from "@webiny/website-builder-sdk";

interface ElementDropZonesProps {
    editorBox: Box;
    previewBox: Box;
    isFirst: boolean;
}

export const ElementDropLines = ({ editorBox, previewBox, isFirst }: ElementDropZonesProps) => {
    const componentManifest = useElementComponentManifest(previewBox.parentId);
    const draggingItem = useDragLayer(monitor => monitor.getItem());
    const isDragging = draggingItem && draggingItem.id === previewBox.id;

    const { proximity } = useProximityDropzone({
        id: previewBox.id,
        box: editorBox
    });

    const anyElementDragged = useIsDragging();
    const hoverBefore = proximity?.position === 0;
    const hoverAfter = proximity?.position === 1;
    const elementLabel = componentManifest?.label ?? componentManifest?.name ?? "";

    const targetInputNode = useMemo(() => {
        if (!proximity?.box.parentSlot) {
            return undefined;
        }

        const inputsAst = ComponentManifestToAstConverter.convert(componentManifest?.inputs ?? []);
        return findMatchingAstNode(proximity?.box.parentSlot, inputsAst);
    }, [proximity?.box.parentSlot]);

    // Figure out if we are allowed to drop the current item into the dropzone.
    let canAcceptComponent = true;
    if (draggingItem && targetInputNode && targetInputNode.type === "slot") {
        const slotInput = targetInputNode.input as SlotInput;
        const whitelistedComponents = slotInput.components;
        if (whitelistedComponents && whitelistedComponents.length > 0) {
            canAcceptComponent = whitelistedComponents.includes(draggingItem?.componentName);
        }
    }

    return anyElementDragged ? (
        <>
            {!isDragging && isFirst && (
                <DropLine
                    label={elementLabel}
                    top={0}
                    visible={hoverBefore && canAcceptComponent}
                    dimmed={false}
                />
            )}
            {!isDragging && (
                <DropLine
                    label={elementLabel}
                    top={previewBox?.height - 2}
                    visible={hoverAfter && canAcceptComponent}
                    dimmed={false}
                />
            )}
        </>
    ) : null;
};
