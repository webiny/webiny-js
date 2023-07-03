import paragraphElementProcessor from "./paragraph";
import buttonElementProcessor from "./button";
import imageElementProcessor from "./image";
import imagesElementProcessor from "./images";
import iconElementProcessor from "./icon";
import embedElementProcessor from "./embed";
import iframeElementProcessor from "./iframe";

export const createElementProcessors = () => {
    return [
        paragraphElementProcessor,
        buttonElementProcessor,
        imageElementProcessor,
        imagesElementProcessor,
        iconElementProcessor,
        embedElementProcessor,
        iframeElementProcessor
    ];
};
