import { ElementAttributesModifier } from "~/types";

const id: ElementAttributesModifier = ({ element }) => {
    return { id: element.data.settings?.property?.id || element.id };
};

export const createId = () => id;
