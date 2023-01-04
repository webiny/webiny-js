import React, { useMemo } from "react";
import { plugins } from "@webiny/plugins";
import { PbEditorPageElementPlugin } from "~/types";
import { useRenderer } from "@webiny/app-page-builder-elements";
import { ElementControlsMainOverlay } from "./ElementControlsMainOverlay";
import { ElementControlHorizontalDropZones } from "./ElementControlHorizontalDropZones";
import { DropElementActionEvent } from "~/editor/recoil/actions";
import { useEventActionHandler } from "~/editor/hooks/useEventActionHandler";
import Droppable, { DragObjectWithTypeWithTarget } from "~/editor/components/Droppable";

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

    const isDroppable = useMemo(() => {
        const plugin = plugins
            .byType<PbEditorPageElementPlugin>("pb-editor-page-element")
            .find(plugin => plugin.elementType === element.type);

        return plugin && plugin.onReceived;
    }, [element.id]);

    const dropElementAction = (source: DragObjectWithTypeWithTarget, position: number) => {
        handler.trigger(
            new DropElementActionEvent({
                source,
                target: {
                    id: element.id,
                    type: element.type,
                    position
                }
            })
        );
    };

    // if (isDroppable) {
    //     return (
    //         <Droppable
    //             onDrop={source => dropElementAction(source, 0)}
    //             type={element.type}
    //             isVisible={() => true}
    //         >
    //             {({ drop }) => <ElementControlsMainOverlay innerRef={drop} />}
    //         </Droppable>
    //     );
    // }

    return (
        <ElementControlsMainOverlay>
            <ElementControlHorizontalDropZones />
        </ElementControlsMainOverlay>
    );
};
