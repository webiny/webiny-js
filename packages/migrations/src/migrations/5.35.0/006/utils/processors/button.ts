import get from "lodash/get";

export const buttonProcessor = (element: any) => {
    if (element.type !== "button") {
        return "";
    }

    return get(element, "data.buttonText");
};
