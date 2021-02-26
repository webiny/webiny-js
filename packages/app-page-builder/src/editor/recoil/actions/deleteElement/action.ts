import { EventActionCallable, PbEditorElement } from "../../../../types";
import { DeleteElementActionArgsType } from "./types";
import { SaveRevisionActionEvent } from "..";

const removeElementFromParent = (parent: PbEditorElement, id: string): PbEditorElement => {
    return {
        ...parent,
        elements: parent.elements.filter(child => child !== id)
    };
};

const getElementParentById = async (state, id): Promise<PbEditorElement> => {
    const element = await state.getElementById(id);
    return await state.getElementById(element.parent);
};

export const deleteElementAction: EventActionCallable<DeleteElementActionArgsType> = async (
    state,
    meta,
    args
) => {
    const { element } = args;
    const parent = await getElementParentById(state, element.id);
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
        actions: [new SaveRevisionActionEvent()]
    };
};
