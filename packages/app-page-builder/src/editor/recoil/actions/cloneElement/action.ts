import { UpdateElementActionEvent } from "..";
import { EventActionCallable, PbEditorElement } from "../../../../types";
import { CloneElementActionArgsType } from "../cloneElement/types";
import { getNanoid } from "../../../helpers";

export const cloneElement = async (state, element: PbEditorElement): Promise<PbEditorElement> => {
    return {
        ...(element as PbEditorElement),
        id: getNanoid(),
        elements: await Promise.all(
            element.elements.map(async el => {
                return cloneElement(state, await state.getElementById(el));
            })
        )
    };
};

export const cloneElementAction: EventActionCallable<CloneElementActionArgsType> = async (
    state,
    _,
    { element }
) => {
    const parent = await state.getElementById(element.parent);
    const position = parent.elements.findIndex(el => el === element.id) + 1;

    const newElement: any = {
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
