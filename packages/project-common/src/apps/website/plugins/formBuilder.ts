import formsGoogleAnalyticsEventTrigger from "@webiny/app-form-builder/render/plugins/triggers/googleAnalyticsEvent";
import formsRedirectTrigger from "@webiny/app-form-builder/render/plugins/triggers/redirect";
import formValidatorGte from "@webiny/app-form-builder/render/plugins/validators/gte";
import fieldValidatorDateTimeGte from "@webiny/app-form-builder/render/plugins/validators/dateTimeGte";
import fieldValidatorDateTimeLte from "@webiny/app-form-builder/render/plugins/validators/dateTimeLte";
import formValidatorIn from "@webiny/app-form-builder/render/plugins/validators/in";
import formValidatorLte from "@webiny/app-form-builder/render/plugins/validators/lte";
import formValidatorMaxLength from "@webiny/app-form-builder/render/plugins/validators/maxLength";
import formValidatorMinLength from "@webiny/app-form-builder/render/plugins/validators/minLength";
import formValidatorPattern from "@webiny/app-form-builder/render/plugins/validators/pattern";
import formValidatorRequired from "@webiny/app-form-builder/render/plugins/validators/required";
import formValidatorUpperCase from "@webiny/app-form-builder/render/plugins/validators/patternPlugins/upperCase";
import formValidatorLowerCase from "@webiny/app-form-builder/render/plugins/validators/patternPlugins/lowerCase";
import formValidatorEmail from "@webiny/app-form-builder/render/plugins/validators/patternPlugins/email";
import formValidatorUrl from "@webiny/app-form-builder/render/plugins/validators/patternPlugins/url";
import formElement from "@webiny/app-form-builder/page-builder/render/plugins/formElement";

export default [
    formsGoogleAnalyticsEventTrigger,
    formsRedirectTrigger,
    formValidatorGte,
    fieldValidatorDateTimeGte,
    fieldValidatorDateTimeLte,
    formValidatorIn,
    formValidatorLte,
    formValidatorMaxLength,
    formValidatorMinLength,
    formValidatorPattern,
    formValidatorRequired,
    formValidatorUpperCase,
    formValidatorLowerCase,
    formValidatorEmail,
    formValidatorUrl,
    formElement
];
