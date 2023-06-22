import React from "react";
import { useRenderer } from "@webiny/app-page-builder-elements";
import { ElementControlsOverlay } from "./ElementControlsOverlay";
import { ElementControlHorizontalDropZones } from "./ElementControlHorizontalDropZones";
import { DropElementActionEvent } from "~/editor/recoil/actions";
import { useEventActionHandler } from "~/editor/hooks/useEventActionHandler";
import Droppable, { DragObjectWithTypeWithTarget } from "~/editor/components/Droppable";
import { useRecoilValue } from "recoil";
import { uiAtom } from "~/editor/recoil/modules";
import { useElementPlugin } from "~/editor/contexts/EditorPageElementsProvider/useElementPlugin";
import { useSnackbar } from "@webiny/app-admin";

// Provides controls and visual feedback for page elements:
// - hover / active visual overlays
// - drag and drop functionality
export const ElementControls = () => {
    const { getElement, meta } = useRenderer();
    const { showSnackbar } = useSnackbar();

    const element = getElement();

    // No need to add any controls and visual feedback for the root document page element.
    // Note that the element type never changes, that's why we're safe to return here,
    // despite the fact that below we're using more React hooks.
    if (element.type === "document") {
        return null;
    }

    // If the current element is a child of a pre-made block,
    // then we don't want to render any controls for any child elements.
    const isBlockChild = meta?.parentBlockElement;
    if (isBlockChild) {
        return null;
    }

    // If the current element is a child of a pre-made template block,
    // then we don't want to render any controls for any child elements.
    const isTemplateBlockChild = meta?.parentTemplateBlockElement;
    if (isTemplateBlockChild) {
        // We don't want to prevent block editing in the template editor. We only want to do it
        // in the page editor, when working with pages that were created from a template. In the
        // page editor, within the `data.template` object, we have a `slug` property, which is not
        // available in the template editor. That give us the ability to distinguish between the two.
        if (meta.parentDocumentElement.data.template.slug) {
            return null;
        }
    }

    const handler = useEventActionHandler();
    const { isDragging } = useRecoilValue(uiAtom);

    const dropElementAction = (source: DragObjectWithTypeWithTarget) => {
        const { target } = source;

        // If the `target` property of the dragged element's plugin is an array, we want to
        // check if the dragged element can be dropped into the target element (the element
        // for which this drop zone is rendered).
        if (Array.isArray(target) && target.length > 0) {
            if (!target.includes(element.type)) {
                showSnackbar("The currently active page element cannot receive child elements.");
                return;
            }
        }

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

    const elementPlugin = useElementPlugin(element);

    // When dragging, if the element is droppable, we want to render the drop zones.
    if (isDragging) {
        let render = <ElementControlHorizontalDropZones />;

        if (elementPlugin?.canReceiveChildren) {
            render = (
                <>
                    <Droppable
                        onDrop={source => dropElementAction(source)}
                        type={element.type}
                        isVisible={() => true}
                    >
                        {({ drop }) => <ElementControlsOverlay dropRef={drop} />}
                    </Droppable>
                    {render}
                </>
            );
        }

        return render;
    }

    return <ElementControlsOverlay />;
};
