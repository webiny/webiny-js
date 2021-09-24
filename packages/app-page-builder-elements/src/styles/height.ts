import { ElementStylesHandler } from "~/types";

const height: ElementStylesHandler = ({ displayModeName, element }) => {
    const { height } = element.data.settings;
    if (!height) {
        return;
    }

    if (height[displayModeName]) {
        return { height: height[displayModeName].value };
    }
};

export const createHeight = () => height;
