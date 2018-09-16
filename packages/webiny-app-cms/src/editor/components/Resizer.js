import React from "react";

class Resizer extends React.Component {
    state = {
        dragging: false
    };

    getMousePosition = e => {
        return this.props.axis === "x" ? e.pageX : e.pageY;
    };

    onMouseDown = e => {
        e.preventDefault();
        e.stopPropagation();
        this.startPosition = this.getMousePosition(e);
        this.setState(
            {
                dragging: true
            },
            () => {
                document.addEventListener("mousemove", this.onMouseMove);
                document.addEventListener("mouseup", this.onMouseUp);
            }
        );
        this.props.onResizeStart();
    };

    onMouseUp = () => {
        if (this.state.dragging) {
            this.setState({ dragging: false });
            this.props.onResizeStop();
        }
    };

    onMouseMove = e => {
        if (!this.state.dragging) {
            return;
        }

        const mousePosition = this.getMousePosition(e);
        this.props.onResize(this.startPosition - mousePosition);
        this.startPosition = mousePosition;
    };

    render() {
        return this.props.children({
            isResizing: this.state.dragging,
            onMouseDown: this.onMouseDown
        });
    }
}

export default Resizer;
