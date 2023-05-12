import paragraphElementProcessor from "./paragraph";
import buttonElementProcessor from "./button";
import imageElementProcessor from "./image";
import imagesElementProcessor from "./images";

export const createElementProcessors = () => {
    return [
        paragraphElementProcessor,
        buttonElementProcessor,
        imageElementProcessor,
        imagesElementProcessor
    ];
};
