import { updateElementAction } from "@webiny/app-page-builder/editor/recoil/actions";
import { DeleteElementActionArgsType } from "@webiny/app-page-builder/editor/recoil/actions/deleteElement/types";
import {
    EventActionCallableType,
    EventActionHandlerActionCallableResponseType
} from "@webiny/app-page-builder/editor/recoil/eventActions";
import { removeElementHelper } from "@webiny/app-page-builder/editor/recoil/helpers";
import { getElementParentWithChildrenById } from "@webiny/app-page-builder/editor/recoil/modules";
import { PbState } from "@webiny/app-page-builder/editor/recoil/modules/types";
import { PbEditorPageElementPlugin, PbElement } from "@webiny/app-page-builder/types";
import { plugins } from "@webiny/plugins";

const updateParentElement = (
    state: PbState,
    parent: PbElement,
    child: PbElement
): EventActionHandlerActionCallableResponseType => {
    const pluginsByType = plugins.byType<PbEditorPageElementPlugin>("pb-editor-page-element");
    const plugin = pluginsByType.find(pl => pl.elementType === parent.type);
    if (!plugin || typeof plugin.onChildDeleted !== "function") {
        return {
            state,
            actions: []
        };
    }
    const mutatedParent = plugin.onChildDeleted({ element: parent, child });
    if (!mutatedParent) {
        return {
            state,
            actions: []
        };
    }
    return updateElementAction(state, {
        element: mutatedParent
    }) as EventActionHandlerActionCallableResponseType;
};
const runUpdateElementAction = (
    state: PbState,
    parent: PbElement,
    child: PbElement
): EventActionHandlerActionCallableResponseType => {
    const result = updateElementAction(state, {
        element: parent
    }) as EventActionHandlerActionCallableResponseType;
    const parentResult = updateParentElement({ ...state, ...result.state }, parent, child);
    return {
        state: {
            page: parentResult.state.page,
            elements: parentResult.state.elements
        },
        actions: [].concat(result?.actions || []).concat(parentResult?.actions || [])
    };
};

export const deleteElementAction: EventActionCallableType<DeleteElementActionArgsType> = (
    state,
    args
) => {
    const { element } = args;

    const parent = getElementParentWithChildrenById(state, element.id);

    const newParent = removeElementHelper(parent, element.id);

    const result = runUpdateElementAction(state, newParent, element);

    return {
        state: {
            ui: {
                ...result.state.ui,
                highlightElement: undefined,
                activeElement: undefined
            },
            page: result.state.page,
            elements: result.state.elements
        },
        actions: result.actions
    };
};
