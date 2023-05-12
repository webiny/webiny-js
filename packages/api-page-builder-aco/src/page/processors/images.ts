import get from "lodash/get";
import { PbAcoContext } from "~/types";

interface Image {
    id: string;
    src: string;
    name: string;
}

export const imagesProcessor = (context: PbAcoContext) => {
    context.pageBuilderAco.addPageSearchProcessor(({ element }) => {
        if (element.type !== "images-list") {
            return "";
        }

        const images: Image[] = get(element, "data.images", []);

        return images
            .filter(Boolean)
            .map(image => image.name)
            .join(" ");
    });
};
