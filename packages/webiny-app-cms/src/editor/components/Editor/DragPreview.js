import React from "react";
import { DragLayer } from "react-dnd";
import styled from "react-emotion";

const layerStyles = {
    position: "fixed",
    pointerEvents: "none",
    zIndex: 100,
    left: 0,
    top: 0,
    width: "100%",
    height: "100%"
};

function getItemStyles(props) {
    const { currentOffset } = props;
    if (!currentOffset) {
        return {
            display: "none"
        };
    }

    const { x, y } = currentOffset;
    const transform = `translate(${x - SIZE / 2 }px, ${y - SIZE / 2}px)`;
    return {
        transform: transform,
        WebkitTransform: transform
    };
}

const SIZE = 30;

const Circle = styled("div")({
    width: SIZE,
    height: SIZE,
    backgroundColor: "var(--mdc-theme-primary)",
    borderRadius: "50%"
});

class CustomDragLayer extends React.Component {
    render() {
        const { isDragging } = this.props;
        if (!isDragging) {
            return null;
        }

        return (
            <div style={layerStyles}>
                <div style={getItemStyles(this.props)}>
                    <Circle/>
                </div>
            </div>
        );
    }
}

export default DragLayer(monitor => ({
    item: monitor.getItem(),
    itemType: monitor.getItemType(),
    currentOffset: monitor.getClientOffset(),
    isDragging: monitor.isDragging()
}))(CustomDragLayer);
