import { documentFileTypeValidator } from "./documentFileType";
import { imageFileTypeValidator } from "./imageFileType";

export const createFileTypeFieldValidators = () => {
    return [documentFileTypeValidator, imageFileTypeValidator];
};
