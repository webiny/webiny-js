import React, { useCallback, useMemo, useRef } from "react";
import { useDragLayer } from "react-dnd";
import { DropLine } from "./DropLine.js";
import { useIsDragging } from "../useIsDragging.js";
import { useProximityDropzone } from "../useProximityDropzone.js";
import type { Box } from "../Box.js";
import { useElementComponentManifest } from "~/BaseEditor/defaultConfig/Content/Preview/useElementComponentManifest.js";
import { ComponentManifestToAstConverter } from "@webiny/website-builder-sdk";
import { findMatchingAstNode } from "@webiny/website-builder-sdk";
import type { SlotInput } from "@webiny/website-builder-sdk";
import { DevToolsSection } from "@webiny/app-admin";

interface ElementDropZonesProps {
    editorBox: Box;
    previewBox: Box;
    isFirst: boolean;
}

export const ElementDropLines = ({ editorBox, previewBox, isFirst }: ElementDropZonesProps) => {
    const componentManifest = useElementComponentManifest(previewBox.parentId);
    const draggingItem = useDragLayer(monitor => monitor.getItem());
    const isDragging = draggingItem && draggingItem.id === previewBox.id;

    // Keep a ref so the canAccept callback always sees the latest dragging item
    // without causing re-registrations.
    const draggingItemRef = useRef(draggingItem);
    draggingItemRef.current = draggingItem;
    const componentManifestRef = useRef(componentManifest);
    componentManifestRef.current = componentManifest;

    const canAccept = useCallback(() => {
        const item = draggingItemRef.current;

        // If nothing is being dragged, don't filter out candidates.
        if (!item) {
            return true;
        }

        const manifest = componentManifestRef.current;
        const inputsAst = ComponentManifestToAstConverter.convert(manifest?.inputs ?? []);
        const targetNode = findMatchingAstNode(editorBox.parentSlot, inputsAst);

        if (!targetNode) {
            return false;
        }

        if (targetNode.type === "slot") {
            const slotInput = targetNode.input as SlotInput;
            const whitelistedComponents = slotInput.components;
            if (whitelistedComponents && whitelistedComponents.length > 0) {
                return whitelistedComponents.includes(item.componentName);
            }
        }

        return true;
    }, [editorBox.parentSlot]);

    const { proximity } = useProximityDropzone({
        id: previewBox.id,
        box: editorBox,
        canAccept
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
    let canAcceptComponent = !!targetInputNode;
    if (draggingItem && targetInputNode && targetInputNode.type === "slot") {
        const slotInput = targetInputNode.input as SlotInput;
        const whitelistedComponents = slotInput.components;
        if (whitelistedComponents && whitelistedComponents.length > 0) {
            canAcceptComponent = whitelistedComponents.includes(draggingItem?.componentName);
        }
    }

    return (
        <>
            <DevToolsSection
                name={"draggingElement"}
                group={"Editor"}
                views={"raw"}
                data={{
                    proximity,
                    canAcceptComponent,
                    targetInputNode
                }}
            />
            {anyElementDragged ? (
                <>
                    {!isDragging && isFirst && (
                        <DropLine
                            label={elementLabel}
                            top={previewBox.top}
                            left={previewBox.left}
                            width={previewBox.width}
                            visible={hoverBefore && canAcceptComponent}
                            dimmed={false}
                        />
                    )}
                    {!isDragging && (
                        <DropLine
                            label={elementLabel}
                            top={previewBox.bottom - 2}
                            left={previewBox.left}
                            width={previewBox.width}
                            visible={hoverAfter && canAcceptComponent}
                            dimmed={false}
                        />
                    )}
                </>
            ) : null}
        </>
    );
};
