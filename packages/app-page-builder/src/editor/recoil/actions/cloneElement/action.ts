import shortid from "shortid";
import { UpdateElementActionEvent } from "@webiny/app-page-builder/editor/recoil/actions";
import { EventActionCallable, PbEditorElement } from "@webiny/app-page-builder/types";
import { CloneElementActionArgsType } from "@webiny/app-page-builder/editor/recoil/actions/cloneElement/types";

export const cloneElement = async (state, element: PbEditorElement): Promise<PbEditorElement> => {
    return {
        ...(element as PbEditorElement),
        id: shortid.generate(),
        elements: await Promise.all(
            element.elements.map(async el => {
                return cloneElement(state, await state.getElementById(el));
            })
        )
    };
};

export const cloneElementAction: EventActionCallable<CloneElementActionArgsType> = async (
    state,
    meta,
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
        actions: [new UpdateElementActionEvent({ element: newElement, history: true })]
    };
};
