import { ElementStylesHandler } from "~/types";

const verticalAlign: ElementStylesHandler = ({ element, breakpointName }) => {
    const { verticalAlign } = element.data.settings;
    if (!verticalAlign || !verticalAlign[breakpointName]) {
        return;
    }

    return { display: "flex", alignItems: verticalAlign[breakpointName] };
};

export const createVerticalAlign = () => verticalAlign;
