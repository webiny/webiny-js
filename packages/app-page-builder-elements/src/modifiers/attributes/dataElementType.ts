import { ElementAttributesModifier } from "~/types";

const dataElementType: ElementAttributesModifier = ({ element }) => {
    return {
        ["data-pb-element-type"]: element.type
    };
};

export const createDataElementType = () => dataElementType;
