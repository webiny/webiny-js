import { ElementStylesHandler } from "~/types";

const padding: ElementStylesHandler = ({ element, breakpointName }) => {
    const { padding } = element.data.settings;
    if (!padding || !padding[breakpointName]) {
        return;
    }

    const values = padding[breakpointName];
    if (values.advanced) {
        return {
            paddingTop: values.top,
            paddingRight: values.right,
            paddingBottom: values.bottom,
            paddingLeft: values.left
        };
    } else {
        return { padding: values.all };
    }
};

export const createPadding = () => padding;
