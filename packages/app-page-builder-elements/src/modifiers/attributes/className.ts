import { ElementAttributesModifier } from "~/types";

const className: ElementAttributesModifier = ({ element }) => {
    return {
        class: [element.data.settings?.property?.className].filter(Boolean).join(" ")
    };
};

export const createClassName = () => className;
