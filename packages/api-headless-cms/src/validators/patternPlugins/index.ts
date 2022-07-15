import { createEmailPatternValidator } from "./email";
import { createUrlPatternValidator } from "./url";
import { createLowerCasePatternValidator } from "./lowerCase";
import { createUpperCasePatternValidator } from "./upperCase";
import { createLowerCaseSpacePatternValidator } from "./lowerCaseSpace";
import { createUpperCaseSpacePatternValidator } from "./upperCaseSpace";
import { CmsModelFieldPatternValidatorPlugin } from "~/types";

export const createPatternValidatorPlugins = (): CmsModelFieldPatternValidatorPlugin[] => {
    return [
        createEmailPatternValidator(),
        createUrlPatternValidator(),
        createLowerCasePatternValidator(),
        createUpperCasePatternValidator(),
        createLowerCaseSpacePatternValidator(),
        createUpperCaseSpacePatternValidator()
    ];
};
