import { ElementAttributesModifier } from "~/types";

const className: ElementAttributesModifier = ({ element }) => {
    return { className: element.data.settings?.property?.className };
};

export const createClassName = () => className;
