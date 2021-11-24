import gteFieldValidator from "./gte";
import dateGteFieldValidator from "./dateGte";
import dateLteFieldValidator from "./dateLte";
import inValidatorFieldValidator from "./in";
import lteFieldValidator from "./lte";
import requiredFieldValidator from "./required";
import minLengthFieldValidator from "./minLength";
import maxLengthFieldValidator from "./maxLength";
import patternFieldValidator from "./pattern";
import emailFieldValidator from "./patternPlugins/email";
import urlFieldValidator from "./patternPlugins/url";
import lowerCaseFieldValidator from "./patternPlugins/lowerCase";
import upperCaseFieldValidator from "./patternPlugins/upperCase";

/**
 * File Type
 */
// import fileTypeFieldValidator from "./fileType";
// import { createFileTypeFieldUiValidators } from "./fileTypePlugins";

export const createFieldUiValidators = () => {
    return [
        gteFieldValidator(),
        dateGteFieldValidator(),
        dateLteFieldValidator(),
        inValidatorFieldValidator(),
        lteFieldValidator(),
        requiredFieldValidator(),
        minLengthFieldValidator(),
        maxLengthFieldValidator(),
        patternFieldValidator(),
        emailFieldValidator(),
        urlFieldValidator(),
        lowerCaseFieldValidator(),
        upperCaseFieldValidator()
        /**
         * File type
         */
        // fileTypeFieldValidator(),
        // createFileTypeFieldUiValidators()
    ];
};
