// @flow
import React from "react";

export default class AutoScale extends React.Component<*, *> {
    content = React.createRef();

    state = {
        width: 0,
        height: 0,
        contentSize: { width: 0, height: 0 },
        scale: 1
    };

    componentDidMount() {
        /**
         * Because there is a transition animation showing the block content,
         * getting dimensions of the block before the transition ends can lead to wrong dimensions.
         * The setTimeout offsets that problem.
         */
        setTimeout(() => {
            this.updateState();
        }, 200);
    }

    updateState() {
        if (!this.content.current || !this.content.current.children) {
            return;
        }

        const actualContent = this.content.current.children[0];

        if (!actualContent) {
            return;
        }

        const contentSize = {
            width: actualContent.offsetWidth,
            height: actualContent.offsetHeight
        };

        const { maxWidth, maxHeight } = this.props;

        let scaleWidth = maxWidth / contentSize.width;
        let scaleHeight = maxHeight / contentSize.height;

        let scale = scaleWidth;
        let height = maxHeight / scaleWidth;
        let width = maxWidth / scaleWidth;
        if (scaleHeight < scaleWidth) {
            scale = scaleHeight;
            height = maxHeight / scaleHeight;
            width = maxHeight / scaleHeight;
        }

        if (width / scale > maxWidth / scale) {
            width = maxWidth / scale;
        }

        if (height / scale > maxHeight / scale) {
            height = maxHeight / scale;
        }

        if (scale > 1) {
            scale = 1;
        }

        this.setState({ width, height, scale });
    }

    render() {
        const { scale, width } = this.state;
        const { children } = this.props;

        return (
            <div
                ref={this.content}
                style={{
                    transform: "scale(" + scale + "), translateX(" + -width + "px)",
                    transformOrigin: "top",
                    width: width ? width + "px" : "auto"
                    /* height: height ? height + "px" : "auto" */
                }}
            >
                {React.cloneElement(children, { ref: this.content })}
            </div>
        );
    }
}
