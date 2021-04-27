import { useRef } from "react";
import { useRecoilValue } from "recoil";
import { useDrag, useDrop, DropTargetMonitor } from "react-dnd";
import { elementByIdSelector, rootElementAtom } from "~/editor/recoil/modules";
import { MoveBlockActionArgsType } from "~/editor/recoil/actions/moveBlock/types";
import { MoveBlockActionEvent } from "~/editor/recoil/actions";
import { useEventActionHandler } from "~/editor/hooks/useEventActionHandler";
import { DraggableItem } from "~/editor/components/Draggable";

const BLOCK = "block";

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

interface XYCoord {
    x: number;
    y: number;
}

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
    const [{ handlerId }, drop] = useDrop({
        accept: BLOCK,
        collect(monitor) {
            return {
                handlerId: monitor.getHandlerId()
            };
        },
        hover(item: DragItem, monitor: DropTargetMonitor) {
            if (!ref.current) {
                return;
            }
            const dragIndex = item.index;
            const hoverIndex = index;

            // Don't replace items with themselves
            if (dragIndex === hoverIndex) {
                return;
            }

            // Determine rectangle on screen
            const hoverBoundingRect = ref.current && ref.current.getBoundingClientRect();

            // Get vertical middle
            const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;

            // Determine mouse position
            const clientOffset = monitor.getClientOffset();

            // Get pixels to the top
            const hoverClientY = (clientOffset as XYCoord).y - hoverBoundingRect.top;

            // Only perform the move when the mouse has crossed half of the items height
            // When dragging downwards, only move when the cursor is below 50%
            // When dragging upwards, only move when the cursor is above 50%

            // Dragging downwards
            if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) {
                return;
            }

            // Dragging upwards
            if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) {
                return;
            }

            // Time to actually perform the action
            move(hoverIndex, dragIndex);
            // Note: we're mutating the monitor item here!
            // Generally it's better to avoid mutations,
            // but it's good here for the sake of performance
            // to avoid expensive index searches.
            item.index = hoverIndex;
        }
    });

    const [{ isDragging }, drag, preview] = useDrag({
        item: { type, target: [BLOCK], id, index } as DraggableItem,
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
        }
    });

    drag(drop(ref));

    return {
        ref,
        isDragging,
        handlerId,
        drag,
        drop,
        preview
    };
};
