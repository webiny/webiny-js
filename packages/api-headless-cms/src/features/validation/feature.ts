import { createFeature } from "@webiny/feature/api";
import { CmsModelFieldValidatorRegistry } from "./CmsModelFieldValidatorRegistry.js";
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
    }
});
