import React from "react";
import { uiAtom } from "../recoil/modules";
import { ConnectDropTarget, DragObjectWithType, useDrop } from "react-dnd";
import { useRecoilValue } from "recoil";

type DefaultVisibilityPropType = {
    type: string;
    isDragging: boolean;
    item: any;
};
const defaultVisibility = ({ type, isDragging, item }: DefaultVisibilityPropType): boolean => {
    const target = (item && item.target) || [];

    if (!item || !target.includes(type)) {
        return false;
    }

    return isDragging;
};

export type DroppableChildrenFunction = (params: {
    isDragging: boolean;
    isOver: boolean;
    isDroppable: boolean;
    drop: ConnectDropTarget;
}) => React.ReactElement;

export type DroppableIsDroppablePropType = (item: any) => boolean;
export type DroppableIsVisiblePropType = (params: {
    type: string;
    item: any;
    isDragging: boolean;
}) => boolean;
export type DragObjectWithTypeWithTarget = DragObjectWithType & {
    id?: string;
    type: string;
    target: string[];
};
export type DroppableOnDropPropType = (item: DragObjectWithTypeWithTarget) => void;
export type DroppableProps = {
    type: string;
    children: DroppableChildrenFunction;
    isDroppable?: DroppableIsDroppablePropType;
    isVisible: DroppableIsVisiblePropType;
    onDrop: DroppableOnDropPropType;
};

const Droppable = (props: DroppableProps) => {
    const { type, children, isDroppable = () => true, onDrop } = props;
    let { isVisible } = props;

    const { isDragging } = useRecoilValue(uiAtom);

    const [{ item, isOver }, drop] = useDrop({
        accept: "element",
        collect: monitor => ({
            isOver: monitor.isOver() && monitor.isOver({ shallow: true }),
            item: monitor.getItem()
        }),
        drop(_, monitor) {
            if (typeof onDrop === "function") {
                onDrop(monitor.getItem());
            }
        }
    });

    if (isVisible === undefined || typeof isVisible !== "function") {
        isVisible = defaultVisibility;
    }

    const isVisibleValue = isVisible({ type, item, isDragging });
    if (!isVisibleValue) {
        return null;
    }

    return children({ isDragging, isOver, isDroppable: isDroppable(item), drop });
};

export default React.memo(Droppable);
