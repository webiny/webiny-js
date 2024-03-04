import { EventActionCallable, EventActionHandlerCallableState, PbEditorElement } from "~/types";
import { CloneElementActionArgsType } from "../cloneElement/types";
import { getNanoid } from "~/editor/helpers";
import { UpdateElementActionEvent } from "~/editor/recoil/actions";
import { getIdGenerator, IdGenerator } from "~/editor/recoil/actions/cloneElement/idGenerator";

const replaceTemplateBlockId = (data: PbEditorElement["data"], id: string) => {
    if ("templateBlockId" in data) {
        return { ...data, templateBlockId: id };
    }

    return data;
};

export const cloneElement = async (
    state: EventActionHandlerCallableState,
    element: PbEditorElement,
    idGenerator: IdGenerator
): Promise<PbEditorElement> => {
    const elementId = getNanoid();
    return {
        ...(element as PbEditorElement),
        id: idGenerator(element),
        data: replaceTemplateBlockId(element.data, elementId),
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

    const newElementId = getNanoid();
    const idGenerator = getIdGenerator(element, newElementId);

    const clonedElement = {
        ...(await cloneElement(state, element, idGenerator)),
        id: newElementId
    };

    const newElement: PbEditorElement = {
        ...parent,
        elements: [
            ...parent.elements.slice(0, position),
            clonedElement,
            ...(position < parent.elements.length ? parent.elements.slice(position) : [])
        ]
    };

    if (element.type === "block" && element.data.blockId) {
        // We also need to update template variables
        newElement.data.template.variables.push({
            blockId: clonedElement.id,
            variables: [...(clonedElement.data.variables || [])]
        });
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
