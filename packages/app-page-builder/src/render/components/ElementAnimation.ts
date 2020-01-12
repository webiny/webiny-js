import * as React from "react";
import aos from "aos";
import "aos/dist/aos.css";
import { throttle, once } from "lodash";

const init = once(() => setTimeout(aos.init, 500));
const refresh = throttle(aos.refreshHard, 250);

type ElementAnimationChildrenFunction = (params: {
    init: () => void;
    refresh: () => void;
}) => React.ReactNode;

type ElementAnimationProps = {
    children: React.ReactNode | ElementAnimationChildrenFunction;
};

class ElementAnimation extends React.Component<ElementAnimationProps> {
    componentDidMount() {
        init();
        refresh();
    }

    render() {
        const { children } = this.props;
        if (typeof children === "function") {
            return (children as ElementAnimationChildrenFunction)({ init, refresh });
        }

        return this.props.children;
    }
}

export default ElementAnimation;
