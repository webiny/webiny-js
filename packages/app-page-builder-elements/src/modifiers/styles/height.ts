import { ElementStylesModifier } from "~/types";

const height: ElementStylesModifier = ({ breakpointName, element }) => {
    const { height } = element.data.settings;
    if (!height) {
        return;
    }

    if (height[breakpointName]) {
        return { height: height[breakpointName].value };
    }
};

export const createHeight = () => height;
