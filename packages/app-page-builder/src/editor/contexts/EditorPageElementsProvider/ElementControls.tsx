import React from "react";
import { useRenderer } from "@webiny/app-page-builder-elements";
import { ElementControlsMainOverlay } from "./ElementControlsMainOverlay";
import { ElementControlHorizontalDropZones } from "./ElementControlHorizontalDropZones";
import { DropElementActionEvent } from "~/editor/recoil/actions";
import { useEventActionHandler } from "~/editor/hooks/useEventActionHandler";
import Droppable, { DragObjectWithTypeWithTarget } from "~/editor/components/Droppable";
import { useRecoilValue } from "recoil";
import { uiAtom } from "~/editor/recoil/modules";

// Lists elements that, when empty, can receive other elements as children using
// drag and drop. For now, the element types that are hardcoded. Down the road,
// we might want to expose this, enabling users to create more complex elements.
const EMPTY_DROPPABLE_ELEMENTS = ["block", "cell"];

// Provides controls and visual feedback for page elements:
// - hover / active visual overlays
// - drag and drop functionality
export const ElementControls = () => {
    const { getElement } = useRenderer();

    const element = getElement();

    // No need to add any controls and visual feedback for the root document page element.
    // Note that the element type never changes, that's why we're safe to return here,
    // despite the fact that below we're using more React hooks.
    if (element.type === "document") {
        return null;
    }

    const handler = useEventActionHandler();
    const { isDragging } = useRecoilValue(uiAtom);

    const dropElementAction = (source: DragObjectWithTypeWithTarget) => {
        handler.trigger(
            new DropElementActionEvent({
                source,
                target: {
                    id: element.id,
                    type: element.type,
                    position: 0
                }
            })
        );
    };

    const isEmpty = element.elements.length === 0;
    const isDroppable = EMPTY_DROPPABLE_ELEMENTS.includes(element.type);
    if (isEmpty && isDroppable && isDragging) {
        // Here we don't need to render `ElementControlHorizontalDropZones` as it's simply
        // not needed. It's only needed when at least one element has been dropped.
        return (
            <Droppable
                onDrop={source => dropElementAction(source)}
                type={element.type}
                isVisible={() => true}
            >
                {({ drop }) => <ElementControlsMainOverlay innerRef={drop} />}
            </Droppable>
        );
    }

    return (
        <ElementControlsMainOverlay>
            <ElementControlHorizontalDropZones />
        </ElementControlsMainOverlay>
    );
};
