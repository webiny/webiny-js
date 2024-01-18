import { useRef, useState } from "react";
import { useRecoilValue } from "recoil";
import { useDrag, useDrop, DropTargetMonitor, DragSourceMonitor } from "react-dnd";
import { elementByIdSelector, rootElementAtom } from "~/editor/recoil/modules";
import { MoveBlockActionArgsType } from "~/editor/recoil/actions/moveBlock/types";
import { MoveBlockActionEvent } from "~/editor/recoil/actions";
import { useEventActionHandler } from "~/editor/hooks/useEventActionHandler";
import { DraggableItem } from "~/editor/components/Draggable";
import { PbEditorElement } from "~/types";

export const BLOCK = "block";

interface UseMoveBlock {
    move: (current: number, next: number) => void;
}
export const useMoveBlock = (elementId: string): UseMoveBlock => {
    const handler = useEventActionHandler();
    const rootElementId = useRecoilValue(rootElementAtom);
    const rootElementValue = useRecoilValue(
        elementByIdSelector(rootElementId as string)
    ) as PbEditorElement;

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
            rootElementId: rootElementId as string
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
    beginDrag?: (monitor: DragSourceMonitor) => void;
    endDrag?: (item: DraggableItem | undefined, monitor: DragSourceMonitor) => void;
}

export const useSortableList = ({ index, move, type, beginDrag, endDrag }: UseSortableListArgs) => {
    const ref = useRef<HTMLDivElement>(null);
    const [dropItemAbove, setDropItemAbove] = useState(false);
    const isDraggingDownwardsRef = useRef<boolean>(false);

    const [dropData, drop] = useDrop<any, any, any>({
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
            const draggingDownwards = isDraggingDownwardsRef.current;

            // Calculate effective drop position.
            let effectiveDropIndex;
            if (draggingDownwards) {
                effectiveDropIndex = dropItemAbove ? dropIndex - 1 : dropIndex;
            } else {
                effectiveDropIndex = dropItemAbove ? dropIndex : dropIndex + 1;
            }

            // Don't replace items with themselves.
            if (dragIndex === effectiveDropIndex) {
                return;
            }

            // Time to actually perform the action
            move(dragIndex, effectiveDropIndex);
            // Note: we're mutating the monitor item here!
            // Generally it's better to avoid mutations,
            // but it's good here for the sake of performance
            // to avoid expensive index searches.
            item.index = dropIndex;
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

            // Set dragging downwards
            isDraggingDownwardsRef.current = dragIndex < hoverIndex;

            // Determine rectangle on screen
            const hoverBoundingRect = ref.current?.getBoundingClientRect();

            // Get vertical middle
            const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;

            // Determine mouse position
            const clientOffset = monitor.getClientOffset();

            // Get pixels to the top
            const hoverClientY = (clientOffset as XYCoord).y - hoverBoundingRect.top;

            // Perform the "drop above" move, only when the cursor is above 50% of the item's height.
            const dropAbove = hoverClientY < hoverMiddleY;
            setDropItemAbove(dropAbove);
        },
        canDrop() {
            return type === BLOCK;
        }
    });

    const [{ isDragging }, drag, preview] = useDrag({
        type,
        item(monitor) {
            if (typeof beginDrag === "function") {
                return beginDrag(monitor);
            }
        },
        collect: monitor => ({
            isDragging: monitor.isDragging()
        }),
        end(item: any, monitor) {
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
        handlerId: dropData.handlerId as string | symbol | null,
        drag,
        drop,
        preview,
        isOver: dropData.isOver,
        dropItemAbove
    };
};
