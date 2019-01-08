// @flow
import * as React from "react";
import aos from "aos";
import "aos/dist/aos.css";
import { throttle, once } from "lodash";

const init = once(() => setTimeout(aos.init, 500));
const refresh = throttle(aos.refreshHard, 250);

type RenderPropParams = { init: Function, refresh: Function };
type Props = {
    children: React.Node | (RenderPropParams => React.Node)
};

class ElementAnimation extends React.Component<Props> {
    componentDidMount() {
        init();
        refresh();
    }

    render() {
        const { children } = this.props;
        if (typeof children === "function") {
            return children({ init, refresh });
        }

        return this.props.children;
    }
}

export default ElementAnimation;
