import { ElementStylesHandler } from "~/types";

const width: ElementStylesHandler = ({ breakpointName, element }) => {
    const { width } = element.data.settings;
    if (!width) {
        return;
    }

    if (width[breakpointName]) {
        return { width: width[breakpointName].value };
    }
};

export const createWidth = () => width;
