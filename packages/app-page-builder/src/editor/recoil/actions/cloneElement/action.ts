import { UpdateElementActionEvent } from "..";
import { EventActionCallable, EventActionHandlerCallableState, PbEditorElement } from "~/types";
import { CloneElementActionArgsType } from "../cloneElement/types";
import { getNanoid } from "~/editor/helpers";

export const cloneElement = async (
    state: EventActionHandlerCallableState,
    element: PbEditorElement
): Promise<PbEditorElement> => {
    return {
        ...(element as PbEditorElement),
        id: getNanoid(),
        elements: await Promise.all(
            element.elements.map(async (el: PbEditorElement | string) => {
                return cloneElement(
                    state,
                    await state.getElementById(typeof el === "string" ? el : el.id)
                );
            })
        )
    };
};

export const cloneElementAction: EventActionCallable<CloneElementActionArgsType> = async (
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
    if (!element.parent) {
        return {
            actions: []
        };
    }
    const parent = await state.getElementById(element.parent);
    const position = parent.elements.findIndex(el => el === element.id) + 1;

    const newElement: PbEditorElement = {
        ...parent,
        elements: [
            ...parent.elements.slice(0, position),
            await cloneElement(state, element),
            ...(position < parent.elements.length ? parent.elements.slice(position) : [])
        ]
    };

    return {
        state: {},
        actions: [
            new UpdateElementActionEvent({
                element: newElement,
                history: true,
                triggerUpdateElementTree: true
            })
        ]
    };
};
