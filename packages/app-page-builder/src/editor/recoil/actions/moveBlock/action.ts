import { EventActionCallable, EventActionHandlerActionCallableResponse } from "~/types";
import { MoveBlockActionArgsType } from "./types";
import { updateElementAction } from "~/editor/recoil/actions";
import { updateBlockPosition } from "~/editor/helpers";

export const moveBlockAction: EventActionCallable<MoveBlockActionArgsType> = async (
    state,
    meta,
    args
) => {
    if (!args) {
        return {
            actions: []
        };
    }
    const { source, target, rootElementId } = args;
    const targetElement = await state.getElementById(target.id);
    if (!targetElement) {
        throw new Error(`There is no element with id "${target.id}"`);
    }

    const sourceElement = await state.getElementById(source.id);
    if (!sourceElement) {
        throw new Error(`There is no element with id "${source.id}"`);
    }

    // Get root element
    const rootElement = await state.getElementById(rootElementId);

    // Update block position.
    const root = updateBlockPosition({
        parent: rootElement,
        sourcePosition: source.position,
        targetPosition: target.position
    });

    return updateElementAction(state, meta, {
        element: root,
        history: true
    }) as EventActionHandlerActionCallableResponse;
};
