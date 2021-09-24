import { ElementStylesHandler } from "~/types";

const padding: ElementStylesHandler = ({ element, displayModeName }) => {
    const { padding } = element.data.settings;
    if (!padding || !padding[displayModeName]) {
        return;
    }

    const values = padding[displayModeName];
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
