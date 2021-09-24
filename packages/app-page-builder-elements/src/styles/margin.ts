import { ElementStylesHandler } from "~/types";

const margin: ElementStylesHandler = ({ element, breakpointName }) => {
    const { margin } = element.data.settings;
    if (!margin || !margin[breakpointName]) {
        return;
    }

    const values = margin[breakpointName];
    if (values.advanced) {
        return {
            marginTop: values.top,
            marginRight: values.right,
            marginBottom: values.bottom,
            marginLeft: values.left
        };
    } else {
        return { margin: values.all };
    }
};

export const createMargin = () => margin;
