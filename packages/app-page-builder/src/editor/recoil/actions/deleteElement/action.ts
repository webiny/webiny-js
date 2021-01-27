import { EventActionCallable, PbElement } from "../../../../types";
import { DeleteElementActionArgsType } from "@webiny/app-page-builder/editor/recoil/actions/deleteElement/types";
import {SaveRevisionActionEvent} from "@webiny/app-page-builder/editor/recoil/actions";

const removeElementFromParent = (parent: PbElement, id: string): PbElement => {
    return {
        ...parent,
        elements: parent.elements.filter(child => child !== id)
    };
};

const getElementParentById = async (state, id): Promise<PbElement> => {
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
