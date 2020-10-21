import { updateElementAction } from "@webiny/app-page-builder/editor/recoil/actions";
import { DeleteElementActionArgsType } from "@webiny/app-page-builder/editor/recoil/actions/deleteElement/types";
import { EventActionCallableType } from "@webiny/app-page-builder/editor/recoil/eventActions";
import { elementParentWithChildrenByIdSelector } from "@webiny/app-page-builder/editor/recoil/modules";
import { PbEditorPageElementPlugin } from "@webiny/app-page-builder/types";
import { plugins } from "@webiny/plugins";
import { useRecoilValue } from "recoil";

// packages/app-page-builder/src/editor/actions/actions.ts:195
export const deleteElementAction: EventActionCallableType<DeleteElementActionArgsType> = (
    state,
    args
) => {
    const { ui, page } = state;
    const { content } = page;
    const { element } = args;

    // deactivateElementMutation();
    const parent = useRecoilValue(elementParentWithChildrenByIdSelector(element.id));

    const newElement = {
        ...parent,
        elements: parent.elements.filter(target => {
            return target.id !== element.id;
        })
    };

    // const updatedContent = updateElement(content, newElement);
    const newState = updateElementAction(state, { element: newElement });

    // Execute `onChildDeleted` if defined
    const pluginsByType = plugins.byType<PbEditorPageElementPlugin>("pb-editor-page-element");
    const plugin = pluginsByType.find(pl => pl.elementType === newElement.type);
    if (!plugin) {
        return;
    }

    if (typeof plugin.onChildDeleted === "function") {
        plugin.onChildDeleted({ element: parent, child: element });
    }

    return {
        state: {
            ui: {
                ...ui,
                activeElement: undefined
            },
            page: {
                ...page,
                content: {
                    ...content
                }
            }
        }
    };
};
