import { ElementStylesHandler } from "~/types";

const border: ElementStylesHandler = ({ element, breakpointName }) => {
    const { border } = element.data.settings;

    if (!border || !border[breakpointName]) {
        return;
    }

    const values = border[breakpointName];
    const styles = {
        borderStyle: values.style,
        borderColor: values.color
    };

    const { width } = values;
    if (width) {
        if (width.advanced) {
            const top = width.top || 0;
            const right = width.right || 0;
            const bottom = width.bottom || 0;
            const left = width.left || 0;

            Object.assign(styles, {
                borderWidth: `${top}px ${right}px ${bottom}px ${left}px `
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
                borderRadiusTop: radius.top && parseInt(radius.top),
                borderRadiusRight: radius.right && parseInt(radius.right),
                borderRadiusBottom: radius.bottom && parseInt(radius.bottom),
                borderRadiusLeft: radius.left && parseInt(radius.left)
            });
        } else {
            Object.assign(styles, { borderRadius: parseInt(radius.all) });
        }
    }

    return styles;
};

export const createBorder = () => border;
