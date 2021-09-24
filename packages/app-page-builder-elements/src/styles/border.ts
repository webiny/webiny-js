import { ElementStylesHandler } from "~/types";

const border: ElementStylesHandler = ({ element, displayModeName }) => {
    const { border } = element.data.settings;

    if (!border || !border[displayModeName]) {
        return;
    }

    const values = border[displayModeName];
    const styles = {
        borderStyle: values.style,
        borderColor: values.color
    };

    const { width } = values;
    if (width) {
        if (width.advanced) {
            Object.assign(styles, {
                borderTop: parseInt(width.top),
                borderRight: parseInt(width.right),
                borderBottom: parseInt(width.bottom),
                borderLeft: parseInt(width.left)
            });
        } else {
            Object.assign(styles, {
                borderWidth: parseInt(width.all)
            });
        }
    }

    const { radius } = values;
    if (radius) {
        if (radius.advanced) {
            Object.assign(styles, {
                borderRadiusTop: parseInt(radius.top),
                borderRadiusRight: parseInt(radius.right),
                borderRadiusBottom: parseInt(radius.bottom),
                borderRadiusLeft: parseInt(radius.left)
            });
        } else {
            Object.assign(styles, { borderRadius: parseInt(radius.all) });
        }
    }

    return styles;
};

export const createBorder = () => border;
