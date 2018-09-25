import React from "react";

export default class AutoScale extends React.Component {
    content = React.createRef();

    state = {
        wrapperSize: { width: 0, height: 0 },
        contentSize: { width: 0, height: 0 },
        scale: 1
    };

    componentDidMount() {
        const actualContent = this.content.current.children[0];

        this.updateState({
            ...this.state,
            contentSize: { width: actualContent.offsetWidth, height: actualContent.offsetHeight }
        });
    }

    updateState(newState) {
        const { maxWidth } = this.props;
        const { contentSize } = newState;

        let scale = maxWidth / contentSize.width;

        if (scale > 1) {
            scale = 1;
        }

        this.setState({
            ...newState,
            scale
        });
    }

    render() {
        const { scale } = this.state;
        const { children } = this.props;

        return (
            <div
                ref={this.content}
                style={{
                    transform: "scale(" + scale + ")",
                    transformOrigin: "top",
                    position: "absolute",
                    top: 0
                }}
            >
                {React.Children.only(children)}
            </div>
        );
    }
}
