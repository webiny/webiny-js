import { ElementStylesHandler } from "~/types";

const height: ElementStylesHandler = ({ breakpointName, element }) => {
    const { height } = element.data.settings;
    if (!height) {
        return;
    }

    if (height[breakpointName]) {
        return { height: height[breakpointName].value };
    }
};

export const createHeight = () => height;
