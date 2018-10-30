import React from "react";

export default class AutoScale extends React.Component {
    content = React.createRef();

    state = {
        width: null,
        height: null,
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
        if (!this.content.current) {
            return;
        }

        const actualContent = this.content.current.children[0];
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

        this.setState({
            width: width,
            height: height,
            scale
        });
    }

    render() {
        const { scale, width, height } = this.state;
        const { children } = this.props;

        return (
            <div
                ref={this.content}
                style={{
                    transform: "scale(" + scale + ")",
                    transformOrigin: "top",
                    position: "absolute",
                    top: 0,
                    width: width ? width + "px" : "auto",
                    height: height ? height + "px" : "auto"
                }}
            >
                {React.Children.only(children)}
            </div>
        );
    }
}
