import { ElementStylesModifier } from "~/types";

const horizontalAlign: ElementStylesModifier = ({ element, breakpointName }) => {
    const { horizontalAlignFlex: horizontalAlign } = element.data.settings;
    if (!horizontalAlign || !horizontalAlign[breakpointName]) {
        return;
    }

    return { display: "flex", justifyContent: horizontalAlign[breakpointName] };
};

export const createHorizontalAlign = () => horizontalAlign;
