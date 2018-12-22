// @flow
import * as React from "react";
import aos from "aos";
import "aos/dist/aos.css";
import { debounce, once } from "lodash";

const init = once(aos.init);
const refresh = debounce(aos.refreshHard, 500);

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
