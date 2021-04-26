import { useRecoilValue } from "recoil";
import { elementByIdSelector, rootElementAtom } from "~/editor/recoil/modules";
import { MoveBlockActionArgsType } from "~/editor/recoil/actions/moveBlock/types";
import { MoveBlockActionEvent } from "~/editor/recoil/actions";
import { useEventActionHandler } from "~/editor/hooks/useEventActionHandler";

export const useBlockMover = elementId => {
    const rootElementId = useRecoilValue(rootElementAtom);
    const rootElementValue = useRecoilValue(elementByIdSelector(rootElementId));
    const handler = useEventActionHandler();

    const moveBlock = (args: MoveBlockActionArgsType) => {
        handler.trigger(new MoveBlockActionEvent(args));
    };

    const canMoveDown = () => {
        if (!rootElementValue) {
            return false;
        }

        const currentIndex = rootElementValue.elements.indexOf(elementId);
        const lastIndex = rootElementValue.elements.length - 1;

        return currentIndex < lastIndex;
    };

    const canMoveUp = () => {
        if (!rootElementValue) {
            return false;
        }

        const currentIndex = rootElementValue.elements.indexOf(elementId);

        return currentIndex > 0;
    };

    const moveUp = () => {
        const currentIndex = rootElementValue.elements.indexOf(elementId);

        if (currentIndex === -1) {
            console.warn(`Element with id => ${elementId} does not exists on root level.`);
            return;
        }
        if (currentIndex === 0) {
            console.log("Already on top, cannot move up further.");
            return;
        }

        moveBlock({
            source: {
                id: elementId,
                position: currentIndex,
                type: "block"
            },
            target: {
                id: rootElementValue.elements[currentIndex - 1] as string,
                position: currentIndex - 1,
                type: "block"
            },
            rootElementId: rootElementId
        });
    };

    const moveDown = () => {
        const currentIndex = rootElementValue.elements.indexOf(elementId);
        const lastIndex = rootElementValue.elements.length;

        if (currentIndex === -1) {
            console.warn(`Element with id => ${elementId} does not exists on root level.`);
            return;
        }
        if (currentIndex === lastIndex) {
            console.log("Already on bottom, cannot move down further.");
            return;
        }

        moveBlock({
            source: {
                id: elementId,
                position: currentIndex,
                type: "block"
            },
            target: {
                id: rootElementValue.elements[currentIndex + 1] as string,
                position: currentIndex + 1,
                type: "block"
            },
            rootElementId: rootElementId
        });
    };

    return {
        moveUp,
        moveDown,
        canMoveUp,
        canMoveDown
    };
};
