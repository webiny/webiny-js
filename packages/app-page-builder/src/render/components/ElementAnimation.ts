import React, { useEffect } from "react";
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

const ElementAnimation: React.FunctionComponent<ElementAnimationProps> = ({ children }) => {
    useEffect(() => {
        init();
        refresh();
    }, []);
    if (typeof children === "function") {
        return (children as ElementAnimationChildrenFunction)({ init, refresh });
    }

    return children as any;
};

export default ElementAnimation;
