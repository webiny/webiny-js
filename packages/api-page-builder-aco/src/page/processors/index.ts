import { buttonProcessor } from "./button";
import { imageProcessor } from "./image";
import { imagesProcessor } from "./images";
import { paragraphProcessor } from "./paragraph";

import { PbAcoContext } from "~/types";

export const createPageProcessors = (context: PbAcoContext) => {
    buttonProcessor(context);
    imageProcessor(context);
    imagesProcessor(context);
    paragraphProcessor(context);
};
