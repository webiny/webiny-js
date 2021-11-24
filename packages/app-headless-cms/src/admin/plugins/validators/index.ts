import gteFieldValidator from "./gte";
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
import dateGteFieldValidator from "./dateGte";
import dateLteFieldValidator from "./dateLte";
import timeGteFieldValidator from "./timeGte";
import timeLteFieldValidator from "./timeLte";

/**
 * File type
 */
// import fileTypeFieldValidator from "./fileType";
// import { createFileTypeFieldValidators } from "./fileTypePlugins";

export const createValidators = () => {
    return [
        gteFieldValidator,
        inValidatorFieldValidator,
        lteFieldValidator,
        requiredFieldValidator,
        minLengthFieldValidator,
        maxLengthFieldValidator,
        patternFieldValidator,
        emailFieldValidator,
        urlFieldValidator,
        lowerCaseFieldValidator,
        upperCaseFieldValidator,
        dateGteFieldValidator(),
        dateLteFieldValidator(),
        timeGteFieldValidator(),
        timeLteFieldValidator()
        /**
         * File type
         */
        // fileTypeFieldValidator(),
        // createFileTypeFieldValidators(),
    ];
};
