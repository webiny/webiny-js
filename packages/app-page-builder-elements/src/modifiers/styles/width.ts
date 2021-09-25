import { ElementStylesModifier } from "~/types";

const width: ElementStylesModifier = ({ breakpointName, element }) => {
    const { width } = element.data.settings;
    if (!width) {
        return;
    }

    if (width[breakpointName]) {
        return { maxWidth: width[breakpointName].value };
    }
};

export const createWidth = () => width;
