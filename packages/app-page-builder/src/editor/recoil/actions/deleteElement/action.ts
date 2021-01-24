import { plugins } from "@webiny/plugins";
import { PbEditorPageElementPlugin, PbElement } from "../../../../types";
import { removeElementHelper } from "../../../helpers";
import { getElementParentWithChildrenById } from "../../modules";
import {
    EventActionCallableType,
    EventActionHandlerActionCallableResponseType,
    EventActionHandlerMetaType
} from "../../eventActions";
import { PbState } from "../../modules/types";
import { updateElementAction, UpdateElementActionEvent } from "../updateElement";
import { DeleteElementActionArgsType } from "./types";

const updateParentElement = (
    state: PbState,
    meta: EventActionHandlerMetaType,
    parent: PbElement,
    child: PbElement
): EventActionHandlerActionCallableResponseType => {
    const pluginsByType = plugins.byType<PbEditorPageElementPlugin>("pb-editor-page-element");
    const plugin = pluginsByType.find(pl => pl.elementType === parent.type);
    if (!plugin || typeof plugin.onChildDeleted !== "function") {
        return {
            state,
            actions: [new UpdateElementActionEvent({ element: parent, history: true })]
        };
    }
    const mutatedParent = plugin.onChildDeleted({ element: parent, child });
    if (!mutatedParent) {
        return {
            state,
            actions: [new UpdateElementActionEvent({ element: parent, history: true })]
        };
    }
    return updateElementAction(state, meta, {
        element: mutatedParent,
        history: true
    }) as EventActionHandlerActionCallableResponseType;
};
const runUpdateElementAction = (
    state: PbState,
    meta: EventActionHandlerMetaType,
    parent: PbElement,
    child: PbElement
): EventActionHandlerActionCallableResponseType => {
    const result = updateElementAction(state, meta, {
        element: parent,
        history: true
    }) as EventActionHandlerActionCallableResponseType;
    const parentResult = updateParentElement({ ...state, ...result.state }, meta, parent, child);
    return {
        state: parentResult.state,
        actions: (result?.actions || []).concat(parentResult?.actions || [])
    };
};

export const deleteElementAction: EventActionCallableType<DeleteElementActionArgsType> = (
    state,
    meta,
    args
) => {
    const { element } = args;
    const parent = getElementParentWithChildrenById(state, element.id);
    console.log("deleteElementAction");
    console.log("element", element);
    console.log("parent", parent);
    const newParent = removeElementHelper(parent, element.id);
    const result = runUpdateElementAction(state, meta, newParent, element);

    return {
        state: {
            ...result.state,
            activeElement: null,
            highlightElement: null,
            ui: {
                ...(result.state?.ui || state.ui)
            }
        },
        actions: result.actions
    };
};
