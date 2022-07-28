import { createGteValidator } from "./gte";
import { createInValidator } from "./in";
import { createLteValidator } from "./lte";
import { createMaxLengthValidator } from "./maxLength";
import { createMinLengthValidator } from "./minLength";
import { createPatternValidator } from "./pattern";
import { createRequiredValidator } from "./required";
import { createPatternValidatorPlugins } from "./patternPlugins";
import { createDateLteValidator } from "./dateLte";
import { createDateGteValidator } from "./dateGte";
import { createTimeLteValidator } from "./timeLte";
import { createTimeGteValidator } from "./timeGte";
import { createUniqueValidator } from "./unique";

export const createValidators = () => [
    createGteValidator(),
    createInValidator(),
    createLteValidator(),
    createMaxLengthValidator(),
    createMinLengthValidator(),
    createPatternValidator(),
    createRequiredValidator(),
    createPatternValidatorPlugins(),
    createDateLteValidator(),
    createDateGteValidator(),
    createTimeLteValidator(),
    createTimeGteValidator(),
    createUniqueValidator()
];
