// @flow
import * as React from "react";
import ReactDOM from "react-dom";
import withinviewport from "withinviewport";
import { throttle } from "lodash";
import
type Props = Object;
type State = {
    reachedViewport: boolean
};

class WithinViewport extends React.Component<Props, State> {
    static defaultProps = {
        placeholder: {
            width: 550,
            height: 550
        }
    };
    state = {
        reachedViewport: false
    };

    componentDidMount() {
        window.addEventListener("scroll", this.checkViewport);
    }

    /**
     * Remove scroll event listener if the component has been unmounted.
     */
    componentWillUnmount() {
        window.removeEventListener("scroll", this.checkViewport);
    }

    checkViewport = throttle(() => {
        if (this.inViewport()) {
            window.removeEventListener("scroll", this.checkViewport);
            this.setState({ reachedViewport: true });
        }
    }, 100);

    /**
     * Check if the component is in the viewport. The 'bottom' parameter in the script actually just increments the size of
     * viewport (that's why it's set in minus, because if it was a plus, it would decrement the bottom edge of screen).
     * @return {Boolean} If the component is in viewport
     */
    inViewport = () => {
        const node = ReactDOM.findDOMNode(this);
        if (!node) {
            return false;
        }

        const inViewport = withinviewport(node, {
            bottom: 0,
            sides: "bottom",
            ...this.props
        });

        console.log(inViewport, node);
    return false;
        return inViewport;
    };

    render() {
        if (this.state.reachedViewport) {
            return this.props.children();
        }

        const { height, width } = this.props.placeholder;
        return <div style={{ border: "1px solid red", height, width, }} />;
    }
}

export default WithinViewport;
