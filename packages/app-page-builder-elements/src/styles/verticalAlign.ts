import { ElementStylesHandler } from "~/types";

const verticalAlign: ElementStylesHandler = ({ element, displayModeName }) => {
    const { verticalAlign } = element.data.settings;
    if (!verticalAlign || !verticalAlign[displayModeName]) {
        return;
    }

    return { display: "flex", alignItems: verticalAlign[displayModeName] };
};

export const createVerticalAlign = () => verticalAlign;
