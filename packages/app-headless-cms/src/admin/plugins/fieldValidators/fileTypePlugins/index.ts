import { imageFileType } from "./image";
import { documentFileType } from "./document";

export const createFileTypeFieldUiValidators = () => {
    return [imageFileType, documentFileType];
};
