import { ElementAttributesModifier } from "~/types";

const className: ElementAttributesModifier = ({ element }) => {
    return {
        className: [element.data.settings?.property?.className, `pb-${element.type}`]
            .filter(Boolean)
            .join(" ")
    };
};

export const createClassName = () => className;
