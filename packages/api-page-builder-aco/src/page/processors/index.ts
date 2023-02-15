import { buttonProcessor } from "./button";
import { imageProcessor } from "./image";
import { imagesProcessor } from "./images";
import { paragraphProcessor } from "./paragraph";

export const createPageProcessors = () => {
    return [buttonProcessor(), imageProcessor(), imagesProcessor(), paragraphProcessor()];
};
