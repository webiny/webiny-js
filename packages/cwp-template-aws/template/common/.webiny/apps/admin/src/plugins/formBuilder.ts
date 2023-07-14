/* Core Form Builder app */
import formBuilderApp from "@webiny/app-form-builder/admin/plugins";

/* Welcome screen widget rendered on admin home screen */
import welcomeScreenWidget from "@webiny/app-form-builder/admin/plugins/welcomeScreenWidget";

/* Form Editor fields */
import editorFieldHidden from "@webiny/app-form-builder/admin/plugins/editor/formFields/hidden";
import editorFieldSelect from "@webiny/app-form-builder/admin/plugins/editor/formFields/select";
import editorFieldText from "@webiny/app-form-builder/admin/plugins/editor/formFields/text";
import editorFieldTextarea from "@webiny/app-form-builder/admin/plugins/editor/formFields/textarea";
import editorFieldNumber from "@webiny/app-form-builder/admin/plugins/editor/formFields/number";
import editorFieldRadioButtons from "@webiny/app-form-builder/admin/plugins/editor/formFields/radioButtons";
import editorFieldCheckboxes from "@webiny/app-form-builder/admin/plugins/editor/formFields/checkboxes";
import editorFieldDateTime from "@webiny/app-form-builder/admin/plugins/editor/formFields/dateTime";
import editorFieldFirstName from "@webiny/app-form-builder/admin/plugins/editor/formFields/contact/firstName";
import editorFieldLastName from "@webiny/app-form-builder/admin/plugins/editor/formFields/contact/lastName";
import editorFieldEmail from "@webiny/app-form-builder/admin/plugins/editor/formFields/contact/email";
import editorFieldWebsite from "@webiny/app-form-builder/admin/plugins/editor/formFields/contact/website";
import editorFieldPhoneNumber from "@webiny/app-form-builder/admin/plugins/editor/formFields/contact/phoneNumber";
import editorFieldStreetAddress from "@webiny/app-form-builder/admin/plugins/editor/formFields/contact/streetAddress";
import editorFieldCity from "@webiny/app-form-builder/admin/plugins/editor/formFields/contact/city";
import editorFieldCountry from "@webiny/app-form-builder/admin/plugins/editor/formFields/contact/country";
import editorFieldStateRegion from "@webiny/app-form-builder/admin/plugins/editor/formFields/contact/stateRegion";
import editorFieldCompanyName from "@webiny/app-form-builder/admin/plugins/editor/formFields/contact/companyName";
import editorFieldJobTitle from "@webiny/app-form-builder/admin/plugins/editor/formFields/contact/jobTitle";
import editorFieldPostCode from "@webiny/app-form-builder/admin/plugins/editor/formFields/contact/postCode";

/* Form Editor field groups */
import formFieldGroupsContact from "@webiny/app-form-builder/admin/plugins/editor/formFieldGroups/contactInformation";

/* Form Editor validation plugins */
import editorValidatorGte from "@webiny/app-form-builder/admin/plugins/editor/formFieldValidators/gte";
import editorValidatorDateTimeGte from "@webiny/app-form-builder/admin/plugins/editor/formFieldValidators/dateTimeGte";
import editorValidatorInValidator from "@webiny/app-form-builder/admin/plugins/editor/formFieldValidators/in";
import editorValidatorLte from "@webiny/app-form-builder/admin/plugins/editor/formFieldValidators/lte";
import editorValidatorDateTimeLte from "@webiny/app-form-builder/admin/plugins/editor/formFieldValidators/dateTimeLte";
import editorValidatorRequired from "@webiny/app-form-builder/admin/plugins/editor/formFieldValidators/required";
import editorValidatorMinLength from "@webiny/app-form-builder/admin/plugins/editor/formFieldValidators/minLength";
import editorValidatorMaxLength from "@webiny/app-form-builder/admin/plugins/editor/formFieldValidators/maxLength";
import editorValidatorPattern from "@webiny/app-form-builder/admin/plugins/editor/formFieldValidators/pattern";
import editorValidatorEmail from "@webiny/app-form-builder/admin/plugins/editor/formFieldValidators/patternPlugins/email";
import editorValidatorUrl from "@webiny/app-form-builder/admin/plugins/editor/formFieldValidators/patternPlugins/url";
import editorValidatorLowerCase from "@webiny/app-form-builder/admin/plugins/editor/formFieldValidators/patternPlugins/lowerCase";
import editorValidatorUpperCase from "@webiny/app-form-builder/admin/plugins/editor/formFieldValidators/patternPlugins/upperCase";

/* Form Editor triggers */
import editorTriggerEmailNotification from "@webiny/app-form-builder/admin/plugins/editor/triggers/emailNotification";
import editorTriggerEmailThanks from "@webiny/app-form-builder/admin/plugins/editor/triggers/emailThanks";
import editorTriggerRedirect from "@webiny/app-form-builder/admin/plugins/editor/triggers/redirect";
import editorTriggerWebhook from "@webiny/app-form-builder/admin/plugins/editor/triggers/webhook";
import editorTriggerGoogleAnalyticsEvent from "@webiny/app-form-builder/admin/plugins/editor/triggers/googleAnalyticsEvent";

/* Page Builder element plugin to insert Forms into your pages */
import pageBuilderPlugins from "@webiny/app-form-builder/page-builder/admin/plugins";

/* Plugins performing input validation when a Form is rendered on a site or in preview mode */
import fieldValidatorGte from "@webiny/app-form-builder/render/plugins/validators/gte";
import fieldValidatorDateTimeGte from "@webiny/app-form-builder/render/plugins/validators/dateTimeGte";
import fieldValidatorInValidator from "@webiny/app-form-builder/render/plugins/validators/in";
import fieldValidatorLte from "@webiny/app-form-builder/render/plugins/validators/lte";
import fieldValidatorDateTimeLte from "@webiny/app-form-builder/render/plugins/validators/dateTimeLte";
import fieldValidatorMaxLength from "@webiny/app-form-builder/render/plugins/validators/maxLength";
import fieldValidatorMinLength from "@webiny/app-form-builder/render/plugins/validators/minLength";
import fieldValidatorPattern from "@webiny/app-form-builder/render/plugins/validators/pattern";
import fieldValidatorRequired from "@webiny/app-form-builder/render/plugins/validators/required";
import fieldValidatorEmail from "@webiny/app-form-builder/render/plugins/validators/patternPlugins/email";
import fieldValidatorUrl from "@webiny/app-form-builder/render/plugins/validators/patternPlugins/url";
import fieldValidatorLowerCase from "@webiny/app-form-builder/render/plugins/validators/patternPlugins/lowerCase";
import fieldValidatorUpperCase from "@webiny/app-form-builder/render/plugins/validators/patternPlugins/upperCase";

/* RichTextEditor config for Form Builder */
import richTextEditor from "./formBuilder/richTextEditor";

export default [
    formBuilderApp(),
    pageBuilderPlugins(),
    welcomeScreenWidget,
    editorFieldHidden,
    editorFieldSelect,
    editorFieldText,
    editorFieldTextarea,
    editorFieldNumber,
    editorFieldRadioButtons,
    editorFieldCheckboxes,
    editorFieldDateTime,
    editorFieldFirstName,
    editorFieldLastName,
    editorFieldEmail,
    editorFieldWebsite,
    editorFieldPhoneNumber,
    editorFieldStreetAddress,
    editorFieldCity,
    editorFieldCountry,
    editorFieldStateRegion,
    editorFieldCompanyName,
    editorFieldJobTitle,
    editorFieldPostCode,
    formFieldGroupsContact,
    editorValidatorGte,
    editorValidatorDateTimeGte,
    editorValidatorInValidator,
    editorValidatorLte,
    editorValidatorDateTimeLte,
    editorValidatorRequired,
    editorValidatorMinLength,
    editorValidatorMaxLength,
    editorValidatorPattern,
    editorValidatorEmail,
    editorValidatorUrl,
    editorValidatorLowerCase,
    editorValidatorUpperCase,
    editorTriggerEmailNotification,
    editorTriggerEmailThanks,
    editorTriggerRedirect,
    editorTriggerWebhook,
    editorTriggerGoogleAnalyticsEvent,
    fieldValidatorGte,
    fieldValidatorDateTimeGte,
    fieldValidatorInValidator,
    fieldValidatorLte,
    fieldValidatorDateTimeLte,
    fieldValidatorMaxLength,
    fieldValidatorMinLength,
    fieldValidatorPattern,
    fieldValidatorRequired,
    fieldValidatorEmail,
    fieldValidatorUrl,
    fieldValidatorLowerCase,
    fieldValidatorUpperCase,
    richTextEditor
];
