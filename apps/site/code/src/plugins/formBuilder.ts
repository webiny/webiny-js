import formsRedirectTrigger from "@webiny/app-form-builder/site/plugins/triggers/redirect";
import formValidatorGte from "@webiny/app-form-builder/site/plugins/validators/gte";
import formValidatorIn from "@webiny/app-form-builder/site/plugins/validators/in";
import formValidatorLte from "@webiny/app-form-builder/site/plugins/validators/lte";
import formValidatorMaxLength from "@webiny/app-form-builder/site/plugins/validators/maxLength";
import formValidatorMinLength from "@webiny/app-form-builder/site/plugins/validators/minLength";
import formValidatorPattern from "@webiny/app-form-builder/site/plugins/validators/pattern";
import formValidatorRequired from "@webiny/app-form-builder/site/plugins/validators/required";
import formValidatorPatternPlugins from "@webiny/app-form-builder/site/plugins/validators/patternPlugins";
import formElement from "@webiny/app-form-builder/page-builder/site/plugins/formElement";

export default [
    formsRedirectTrigger,
    formValidatorGte,
    formValidatorIn,
    formValidatorLte,
    formValidatorMaxLength,
    formValidatorMinLength,
    formValidatorPattern,
    formValidatorRequired,
    formValidatorPatternPlugins,
    formElement
];
