import { createFeature } from "@webiny/feature/admin";
import {
    RequiredValidator,
    UniqueValidator,
    MinLengthValidator,
    MaxLengthValidator,
    GteValidator,
    LteValidator,
    InValidator,
    PatternValidator,
    DateGteValidator,
    DateLteValidator
} from "./validators/index.js";
import { DefaultPatternFactory } from "./DefaultPatternFactory.js";

export const CmsFieldValidatorFeature = createFeature({
    name: "CmsFieldValidators",
    register(container) {
        container.register(RequiredValidator);
        container.register(UniqueValidator);
        container.register(MinLengthValidator);
        container.register(MaxLengthValidator);
        container.register(GteValidator);
        container.register(LteValidator);
        container.register(InValidator);
        container.register(PatternValidator);
        container.register(DateGteValidator);
        container.register(DateLteValidator);
        container.register(DefaultPatternFactory);
    }
});
