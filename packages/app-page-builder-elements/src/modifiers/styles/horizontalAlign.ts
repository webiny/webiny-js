import { ElementStylesModifier } from "~/types";

const horizontalAlign: ElementStylesModifier = ({ element, theme }) => {
    const { horizontalAlignFlex: horizontalAlign } = element.data.settings || {};
    if (!horizontalAlign) {
        return null;
    }

    return Object.keys(theme.breakpoints || {}).reduce((returnStyles, breakpointName) => {
        if (!horizontalAlign || !horizontalAlign[breakpointName]) {
            return returnStyles;
        }

        return {
            ...returnStyles,
            [breakpointName]: {
                display: "flex",
                flexDirection: "column",
                alignItems: 'center',
                justifyContent: horizontalAlign[breakpointName]
            }
        };
    }, {});
};

export const createHorizontalAlign = () => horizontalAlign;
