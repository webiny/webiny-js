import { useRef, useState } from "react";
import { useDrag, useDrop, DropTargetMonitor } from "react-dnd";
import { DraggableItem } from "~/editor/components/Draggable";
import { PbEditorElement } from "~/types";
import { useUpdateElement } from "~/editor/hooks/useUpdateElement";

const moveInPlace = (arr: any[], from: number, to: number): any[] => {
    const newArray = [...arr];
    const [item] = newArray.splice(from, 1);
    newArray.splice(to, 0, item);

    return newArray;
};

interface UseMoveVariable {
    move: (current: number, next: number) => void;
}

export const useMoveVariable = (element: PbEditorElement): UseMoveVariable => {
    const updateElement = useUpdateElement();
    const move = (current: number, next: number) => {
        const reorderedVariables = moveInPlace(element?.data?.variables, current, next);

        updateElement({
            ...element,
            data: {
                ...element.data,
                variables: reorderedVariables
            }
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
    const [dropItemAbove, setDropItemAbove] = useState(false);
    const isDraggingDownwardsRef = useRef<boolean>(false);

    const [{ handlerId, isOver }, drop] = useDrop({
        accept: "variable",
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
        }
    });

    const [{ isDragging }, drag, preview] = useDrag({
        item: { type, target: ["variable"], id, index, dragInNavigator: true } as DraggableItem,
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
        preview,
        isOver,
        dropItemAbove
    };
};
