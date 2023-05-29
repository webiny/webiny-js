import { createSimpleSingleRenderer } from "./simpleSingleRenderer";
import { createSimpleMultipleRenderer } from "./simpleMultipleRenderer";

export const createSimpleRefRenderer = () => {
    return [createSimpleSingleRenderer(), createSimpleMultipleRenderer()];
};
