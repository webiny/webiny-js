import get from "lodash/get";

export const imageProcessor = (element: any) => {
    if (element.type !== "image") {
        return "";
    }

    return get(element, "data.image.title");
};
