import { createFeature } from "@webiny/feature/api";
import { CmsModelFieldValidatorRegistry } from "./CmsModelFieldValidatorRegistry.js";
import { CmsModelFieldPatternValidatorRegistry } from "./CmsModelFieldPatternValidatorRegistry.js";
import { RequiredValidator } from "./validators/RequiredValidator.js";
import { MinLengthValidator } from "./validators/MinLengthValidator.js";
import { MaxLengthValidator } from "./validators/MaxLengthValidator.js";
import { GteValidator } from "./validators/GteValidator.js";
import { LteValidator } from "./validators/LteValidator.js";
import { DateGteValidator } from "./validators/DateGteValidator.js";
import { DateLteValidator } from "./validators/DateLteValidator.js";
import { TimeGteValidator } from "./validators/TimeGteValidator.js";
import { TimeLteValidator } from "./validators/TimeLteValidator.js";
import { InValidator } from "./validators/InValidator.js";
import { PatternValidator } from "./validators/PatternValidator.js";
import { UniqueValidator } from "./validators/UniqueValidator.js";
import { EmailPattern } from "./validators/patterns/EmailPattern.js";
import { UrlPattern } from "./validators/patterns/UrlPattern.js";
import { LowerCasePattern } from "./validators/patterns/LowerCasePattern.js";
import { UpperCasePattern } from "./validators/patterns/UpperCasePattern.js";
import { LowerCaseSpacePattern } from "./validators/patterns/LowerCaseSpacePattern.js";
import { UpperCaseSpacePattern } from "./validators/patterns/UpperCaseSpacePattern.js";

export const ValidationFeature = createFeature({
    name: "Cms/ValidationFeature",
    register: container => {
        container.register(RequiredValidator);
        container.register(MinLengthValidator);
        container.register(MaxLengthValidator);
        container.register(GteValidator);
        container.register(LteValidator);
        container.register(DateGteValidator);
        container.register(DateLteValidator);
        container.register(TimeGteValidator);
        container.register(TimeLteValidator);
        container.register(InValidator);
        container.register(PatternValidator);
        container.register(UniqueValidator);
        container.register(CmsModelFieldValidatorRegistry);
        container.register(EmailPattern);
        container.register(UrlPattern);
        container.register(LowerCasePattern);
        container.register(UpperCasePattern);
        container.register(LowerCaseSpacePattern);
        container.register(UpperCaseSpacePattern);
        container.register(CmsModelFieldPatternValidatorRegistry);
    }
});
