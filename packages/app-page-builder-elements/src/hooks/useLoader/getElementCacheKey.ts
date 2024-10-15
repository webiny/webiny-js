import { Element } from "~/types";
import { createObjectHash } from "./createObjectHash";

export const getElementCacheKey = (element: Element) => {
    const elementDataHash = createObjectHash(element.data);
    return `${element.id}-${elementDataHash}`;
};
