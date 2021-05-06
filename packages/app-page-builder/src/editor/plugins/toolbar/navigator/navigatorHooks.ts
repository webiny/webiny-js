import { useRef } from "react";
import { useRecoilValue } from "recoil";
import { useDrag, useDrop } from "react-dnd";
import { elementByIdSelector, rootElementAtom } from "~/editor/recoil/modules";
import { MoveBlockActionArgsType } from "~/editor/recoil/actions/moveBlock/types";
import { MoveBlockActionEvent } from "~/editor/recoil/actions";
import { useEventActionHandler } from "~/editor/hooks/useEventActionHandler";
import { DraggableItem } from "~/editor/components/Draggable";

export const BLOCK = "block";

export const useMoveBlock = elementId => {
    const rootElementId = useRecoilValue(rootElementAtom);
    const rootElementValue = useRecoilValue(elementByIdSelector(rootElementId));
    const handler = useEventActionHandler();

    const moveBlock = (args: MoveBlockActionArgsType) => {
        handler.trigger(new MoveBlockActionEvent(args));
    };

    const move = (current: number, next: number) => {
        moveBlock({
            source: {
                id: elementId,
                position: current,
                type: "block"
            },
            target: {
                id: rootElementValue.elements[next] as string,
                position: next,
                type: "block"
            },
            rootElementId: rootElementId
        });
    };

    return {
        move
    };
};

interface DragItem {
    index: number;
    id: string;
    type: string;
}

interface UseSortableListArgs {
    index: number;
    id: string;
    type: string;
    move: (current: number, next: number) => void;
    beginDrag?: Function;
    endDrag?: Function;
}

export const useSortableList = ({
    index,
    move,
    id,
    type,
    beginDrag,
    endDrag
}: UseSortableListArgs) => {
    const ref = useRef<HTMLDivElement>(null);
    const [{ handlerId, isOver }, drop] = useDrop({
        accept: BLOCK,
        collect(monitor) {
            return {
                handlerId: monitor.getHandlerId(),
                isOver: monitor.isOver() && monitor.isOver({ shallow: true })
            };
        },
        drop(item: DragItem) {
            if (!ref.current) {
                return;
            }
            const dragIndex = item.index;
            const dropIndex = index;

            // Don't replace items with themselves
            if (dragIndex === dropIndex) {
                return;
            }

            // Time to actually perform the action
            move(dragIndex, dropIndex);
            // Note: we're mutating the monitor item here!
            // Generally it's better to avoid mutations,
            // but it's good here for the sake of performance
            // to avoid expensive index searches.
            item.index = dropIndex;
        }
    });

    const [{ isDragging }, drag, preview] = useDrag({
        item: { type, target: [BLOCK], id, index, dragInNavigator: true } as DraggableItem,
        collect: monitor => ({
            isDragging: monitor.isDragging()
        }),
        begin(monitor) {
            if (typeof beginDrag === "function") {
                return beginDrag(monitor);
            }
        },
        end(item, monitor) {
            if (typeof endDrag === "function") {
                return endDrag(item, monitor);
            }
        },
        canDrag: type === BLOCK
    });

    drag(drop(ref));

    return {
        ref,
        isDragging,
        handlerId,
        drag,
        drop,
        preview,
        isOver
    };
};
