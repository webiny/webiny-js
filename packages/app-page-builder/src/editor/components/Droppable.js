// @flow
import * as React from "react";
import { useDrop } from "react-dnd";
import { connect } from "@webiny/app-page-builder/editor/redux";
import { getIsDragging } from "@webiny/app-page-builder/editor/selectors";

const defaultVisibility = ({ type, isDragging, item }) => {
    const target = (item && item.target) || [];

    if (!item || !target.includes(type)) {
        return false;
    }

    return isDragging;
};

const Droppable = React.memo(props => {
    let { type, children, isDragging, isDroppable = () => true, isVisible, onDrop } = props;

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

    // $FlowFixMe
    return children({ isDragging, isOver, isDroppable: isDroppable(item), drop });
});

const mapStateToProps = state => ({ isDragging: getIsDragging(state) });

export default connect(mapStateToProps)(Droppable);
