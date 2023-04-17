import get from "lodash/get";

export const imageProcessor = (element: Record<string, any>) => {
    if (element.type !== "image") {
        return "";
    }

    return get(element, "data.image.title");
};
