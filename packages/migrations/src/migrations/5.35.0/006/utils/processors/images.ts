import get from "lodash/get";

interface Image {
    id: string;
    src: string;
    name: string;
}

export const imagesProcessor = (element: any) => {
    if (element.type !== "images-list") {
        return "";
    }

    const images: Image[] = get(element, "data.images", []);

    return images
        .filter(Boolean)
        .map(image => image.name)
        .join(" ");
};
