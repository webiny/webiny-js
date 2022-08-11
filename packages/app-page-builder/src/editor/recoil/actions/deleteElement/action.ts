import { EventActionCallable, EventActionHandlerCallableState, PbEditorElement } from "~/types";
import { DeleteElementActionArgsType } from "./types";
import { UpdateDocumentActionEvent } from "~/editor/recoil/actions/updateDocument";

const removeElementFromParent = (parent: PbEditorElement, id: string): PbEditorElement => {
    return {
        ...parent,
        elements: parent.elements.filter(child => child !== id)
    };
};

const getElementParentById = async (
    state: EventActionHandlerCallableState,
    id: string
): Promise<PbEditorElement | null> => {
    const element = await state.getElementById(id);
    if (!element || !element.parent) {
        return null;
    }
    return await state.getElementById(element.parent);
};

export const deleteElementAction: EventActionCallable<DeleteElementActionArgsType> = async (
    state,
    _,
    args
) => {
    if (!args) {
        return {
            actions: []
        };
    }
    const { element } = args;
    const parent = await getElementParentById(state, element.id);
    if (!parent) {
        return {
            actions: []
        };
    }
    const newParent = removeElementFromParent(parent, element.id);

    return {
        state: {
            ...state,
            elements: {
                ...state.elements,
                [newParent.id]: newParent
            },
            activeElement: null,
            highlightElement: null
        },
        actions: [new UpdateDocumentActionEvent()]
    };
};
