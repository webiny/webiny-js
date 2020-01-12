import * as React from "react";
import { ConnectDropTarget, DragObjectWithType, useDrop } from "react-dnd";
import { connect } from "@webiny/app-page-builder/editor/redux";
import { getIsDragging } from "@webiny/app-page-builder/editor/selectors";

const defaultVisibility = ({ type, isDragging, item }) => {
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

export type DroppableProps = {
    type: string;
    children: DroppableChildrenFunction;
    isDragging: boolean;
    isDroppable(item: any): boolean;
    isVisible(params: { type: string; item: any; isDragging: boolean }): boolean;
    onDrop(item: DragObjectWithType);
};

const Droppable = React.memo((props: DroppableProps) => {
    const { type, children, isDragging, isDroppable = () => true, onDrop } = props;
    let { isVisible } = props;

    const [{ item, isOver }, drop] = useDrop({
        accept: "element",
        collect: monitor => ({
            isOver: monitor.isOver() && monitor.isOver({ shallow: true }),
            item: monitor.getItem()
        }),
        drop(item, monitor) {
            if (typeof onDrop === "function") {
                onDrop(monitor.getItem());
            }
        }
    });

    if (!isVisible) {
        isVisible = defaultVisibility;
    }

    if (!isVisible({ type, item, isDragging })) {
        return null;
    }

    return children({ isDragging, isOver, isDroppable: isDroppable(item), drop });
});

const mapStateToProps = state => ({ isDragging: getIsDragging(state) });

export default connect<any, any, any>(mapStateToProps)(Droppable);
