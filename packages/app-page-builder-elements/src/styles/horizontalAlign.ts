import { ElementStylesHandler } from "~/types";

const horizontalAlign: ElementStylesHandler = ({ element, displayModeName }) => {
    const { horizontalAlignFlex: horizontalAlign } = element.data.settings;
    if (!horizontalAlign || !horizontalAlign[displayModeName]) {
        return;
    }

    return { display: "flex", justifyContent: horizontalAlign[displayModeName] };
};

export const createHorizontalAlign = () => horizontalAlign;
