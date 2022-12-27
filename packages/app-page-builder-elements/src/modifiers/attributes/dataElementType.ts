import { ElementAttributesModifier } from "~/types";

const dataElementType: ElementAttributesModifier = ({ element }) => {
    return {
        ["data-pbe"]: element.type
    };
};

export const createDataElementType = () => dataElementType;
