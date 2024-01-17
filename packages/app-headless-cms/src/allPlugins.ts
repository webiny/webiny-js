import headlessCmsPlugins from "~/admin/plugins";
import textField from "~/admin/plugins/fields/text";
import longTextField from "~/admin/plugins/fields/longText";
import richTextField from "~/admin/plugins/fields/richText";
import numberField from "~/admin/plugins/fields/number";
import booleanField from "~/admin/plugins/fields/boolean";
import dateTimeField from "~/admin/plugins/fields/dateTime";
import refField from "~/admin/plugins/fields/ref";
import objectField from "~/admin/plugins/fields/object";

import numberFieldRenderer from "~/admin/plugins/fieldRenderers/number";
import textFieldRenderer from "~/admin/plugins/fieldRenderers/text";
import longTextFieldRenderer from "~/admin/plugins/fieldRenderers/longText";
import { createLegacyRichTextInput } from "~/admin/plugins/fieldRenderers/richText";
import { createLexicalInput } from "~/admin/plugins/fieldRenderers/lexicalText";
import booleanFieldRenderer from "~/admin/plugins/fieldRenderers/boolean";
import dateTimeFieldRenderer from "~/admin/plugins/fieldRenderers/dateTime";
import radioButtonsFieldRenderer from "~/admin/plugins/fieldRenderers/radioButtons";
import selectFieldRenderer from "~/admin/plugins/fieldRenderers/select";
import checkboxesFieldRenderer from "~/admin/plugins/fieldRenderers/checkboxes";
import refFieldRenderer from "~/admin/plugins/fieldRenderers/ref";
import objectFieldRenderer from "~/admin/plugins/fieldRenderers/object";

import editorGteFieldValidator from "~/admin/plugins/fieldValidators/gte";
import editorDateGteFieldValidator from "~/admin/plugins/fieldValidators/dateGte";
import editorDateLteFieldValidator from "~/admin/plugins/fieldValidators/dateLte";
import editorInValidatorFieldValidator from "~/admin/plugins/fieldValidators/in";
import editorLteFieldValidator from "~/admin/plugins/fieldValidators/lte";
import editorRequiredFieldValidator from "~/admin/plugins/fieldValidators/required";
import editorUniqueFieldValidator from "~/admin/plugins/fieldValidators/unique";
import editorMinLengthFieldValidator from "~/admin/plugins/fieldValidators/minLength";
import editorMaxLengthFieldValidator from "~/admin/plugins/fieldValidators/maxLength";
import editorPatternFieldValidator from "~/admin/plugins/fieldValidators/pattern";
import editorEmailFieldValidator from "~/admin/plugins/fieldValidators/patternPlugins/email";
import editorUrlFieldValidator from "~/admin/plugins/fieldValidators/patternPlugins/url";
import editorLowerCaseFieldValidator from "~/admin/plugins/fieldValidators/patternPlugins/lowerCase";
import editorUpperCaseFieldValidator from "~/admin/plugins/fieldValidators/patternPlugins/upperCase";
import editorLowerCaseSpaceFieldValidator from "~/admin/plugins/fieldValidators/patternPlugins/lowerCaseSpace";
import editorUpperCaseSpaceFieldValidator from "~/admin/plugins/fieldValidators/patternPlugins/upperCaseSpace";
import welcomeScreenWidget from "~/admin/plugins/welcomeScreenWidget";
import { dynamicZoneField } from "~/admin/plugins/fields/dynamicZone";
import { dynamicZoneFieldRenderer } from "~/admin/plugins/fieldRenderers/dynamicZone/dynamicZoneRenderer";
import { dynamicZoneFieldValidator } from "~/admin/plugins/fieldValidators/dynamicZone";

export default [
    headlessCmsPlugins(),
    textField,
    longTextField,
    richTextField,
    numberField,
    booleanField,
    dateTimeField,
    createLexicalInput(),
    refField,
    numberFieldRenderer,
    textFieldRenderer,
    longTextFieldRenderer,
    createLegacyRichTextInput(),
    booleanFieldRenderer,
    dateTimeFieldRenderer,
    radioButtonsFieldRenderer,
    selectFieldRenderer,
    checkboxesFieldRenderer,
    refFieldRenderer,
    editorGteFieldValidator,
    editorDateGteFieldValidator(),
    editorDateLteFieldValidator(),
    editorInValidatorFieldValidator,
    editorLteFieldValidator,
    editorRequiredFieldValidator,
    editorUniqueFieldValidator(),
    editorMinLengthFieldValidator,
    editorMaxLengthFieldValidator,
    editorPatternFieldValidator,
    editorEmailFieldValidator,
    editorUrlFieldValidator,
    editorLowerCaseFieldValidator,
    editorUpperCaseFieldValidator,
    editorLowerCaseSpaceFieldValidator,
    editorUpperCaseSpaceFieldValidator,
    dynamicZoneFieldValidator,
    welcomeScreenWidget,
    objectField,
    objectFieldRenderer,
    dynamicZoneField,
    dynamicZoneFieldRenderer
];
