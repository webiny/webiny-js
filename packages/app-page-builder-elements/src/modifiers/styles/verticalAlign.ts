import { ElementStylesModifier } from "~/types";

const verticalAlign: ElementStylesModifier = ({ element, breakpointName }) => {
    const { verticalAlign } = element.data.settings;
    if (!verticalAlign || !verticalAlign[breakpointName]) {
        return;
    }

    return { display: "flex", alignItems: verticalAlign[breakpointName] };
};

export const createVerticalAlign = () => verticalAlign;
