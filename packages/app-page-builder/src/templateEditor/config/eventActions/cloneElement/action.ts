import { EventActionCallable, EventActionHandlerCallableState, PbEditorElement } from "~/types";
import { CloneElementActionArgsType } from "../cloneElement/types";
import { UpdateElementActionEvent } from "~/editor/recoil/actions";
import { getIdGenerator, IdGenerator } from "~/editor/recoil/actions/cloneElement/idGenerator";
import { generateBlockVariableIds } from "~/editor/helpers";

const replaceTemplateId = (data: PbEditorElement["data"], id: string) => {
    if ("templateBlockId" in data) {
        return {
            ...data,
            templateBlockId: id
        };
    }

    return data;
};

/**
 * Replace the block ID portion of the variable ID with the given `id`.
 */
const replaceVariableIds = (data: PbEditorElement["data"], id: string) => {
    if ("variables" in data) {
        return {
            ...data,
            variables: generateBlockVariableIds(data.variables || [], id)
        };
    }

    return data;
};

export const cloneElement = async (
    state: EventActionHandlerCallableState,
    element: PbEditorElement,
    idGenerator: IdGenerator
): Promise<PbEditorElement> => {
    const elementId = idGenerator(element);
    return {
        ...(element as PbEditorElement),
        id: elementId,
        elements: await Promise.all(
            element.elements.map(async (el: PbEditorElement | string) => {
                return cloneElement(
                    state,
                    await state.getElementById(typeof el === "string" ? el : el.id),
                    idGenerator
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
    const parent = structuredClone(await state.getElementById(element.parent));
    const position = parent.elements.findIndex(el => el === element.id) + 1;

    const idGenerator = getIdGenerator(element);

    const clonedElement = await cloneElement(state, element, idGenerator);

    const newElement: PbEditorElement = {
        ...parent,
        elements: [
            ...parent.elements.slice(0, position),
            clonedElement,
            ...(position < parent.elements.length ? parent.elements.slice(position) : [])
        ]
    };

    if (element.type === "block" && element.data.blockId) {
        clonedElement.data = [replaceTemplateId, replaceVariableIds].reduce(
            (data, fn) => fn(data, clonedElement.id),
            element.data
        );
    }

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
