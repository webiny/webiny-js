import { ElementStylesModifier } from "~/types";

const horizontalAlign: ElementStylesModifier = ({ element, theme }) => {
    const { horizontalAlignFlex: horizontalAlign } = element.data.settings;
    if (!horizontalAlign) {
        return;
    }

    return Object.keys(theme.breakpoints).reduce((returnStyles, breakpointName) => {
        if (!horizontalAlign || !horizontalAlign[breakpointName]) {
            return returnStyles;
        }

        return {
            ...returnStyles,
            [breakpointName]: { display: "flex", justifyContent: horizontalAlign[breakpointName] }
        };
    }, {});
};

export const createHorizontalAlign = () => horizontalAlign;
