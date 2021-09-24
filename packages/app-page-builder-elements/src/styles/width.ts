import { ElementStylesHandler } from "~/types";

const width: ElementStylesHandler = ({ displayModeName, element }) => {
    const { width } = element.data.settings;
    if (!width) {
        return;
    }

    if (width[displayModeName]) {
        return { width: width[displayModeName].value };
    }
};

export const createWidth = () => width;
