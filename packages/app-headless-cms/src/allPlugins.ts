import headlessCmsPlugins from "~/admin/plugins";
import textField from "~/admin/plugins/fields/text";
import longTextField from "~/admin/plugins/fields/longText";
import richTextField from "~/admin/plugins/fields/richText";
import numberField from "~/admin/plugins/fields/number";
import booleanField from "~/admin/plugins/fields/boolean";
import dateTimeField from "~/admin/plugins/fields/dateTime";
import fileField from "~/admin/plugins/fields/file";
import refField from "~/admin/plugins/fields/ref";
import objectField from "~/admin/plugins/fields/object";

import numberFieldRenderer from "~/admin/plugins/fieldRenderers/number";
import textFieldRenderer from "~/admin/plugins/fieldRenderers/text";
import longTextFieldRenderer from "~/admin/plugins/fieldRenderers/longText";
import richTextFieldRenderer from "~/admin/plugins/fieldRenderers/richText";
import booleanFieldRenderer from "~/admin/plugins/fieldRenderers/boolean";
import dateTimeFieldRenderer from "~/admin/plugins/fieldRenderers/dateTime";
import fileFieldRenderer from "~/admin/plugins/fieldRenderers/file";
import radioButtonsFieldRenderer from "~/admin/plugins/fieldRenderers/radioButtons";
import selectFieldRenderer from "~/admin/plugins/fieldRenderers/select";
import checkboxesFieldRenderer from "~/admin/plugins/fieldRenderers/checkboxes";
import refFieldRenderer from "~/admin/plugins/fieldRenderers/ref";
import objectFieldRenderer from "~/admin/plugins/fieldRenderers/object";

import gteFieldValidator from "~/admin/plugins/validators/gte";
import inValidatorFieldValidator from "~/admin/plugins/validators/in";
import lteFieldValidator from "~/admin/plugins/validators/lte";
import requiredFieldValidator from "~/admin/plugins/validators/required";
import minLengthFieldValidator from "~/admin/plugins/validators/minLength";
import maxLengthFieldValidator from "~/admin/plugins/validators/maxLength";
import patternFieldValidator from "~/admin/plugins/validators/pattern";
import emailFieldValidator from "~/admin/plugins/validators/patternPlugins/email";
import urlFieldValidator from "~/admin/plugins/validators/patternPlugins/url";
import lowerCaseFieldValidator from "~/admin/plugins/validators/patternPlugins/lowerCase";
import upperCaseFieldValidator from "~/admin/plugins/validators/patternPlugins/upperCase";
import lowerCaseSpaceFieldValidator from "~/admin/plugins/validators/patternPlugins/lowerCaseSpace";
import upperCaseSpaceFieldValidator from "~/admin/plugins/validators/patternPlugins/upperCaseSpace";
import dateGteFieldValidator from "~/admin/plugins/validators/dateGte";
import dateLteFieldValidator from "~/admin/plugins/validators/dateLte";
import timeGteFieldValidator from "~/admin/plugins/validators/timeGte";
import timeLteFieldValidator from "~/admin/plugins/validators/timeLte";
import uniqueFieldValidator from "~/admin/plugins/validators/unique";

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

export default [
    headlessCmsPlugins(),
    textField,
    longTextField,
    richTextField,
    numberField,
    booleanField,
    dateTimeField,
    fileField,
    refField,
    numberFieldRenderer,
    textFieldRenderer,
    longTextFieldRenderer,
    richTextFieldRenderer,
    booleanFieldRenderer,
    dateTimeFieldRenderer,
    fileFieldRenderer,
    radioButtonsFieldRenderer,
    selectFieldRenderer,
    checkboxesFieldRenderer,
    refFieldRenderer,
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
    lowerCaseSpaceFieldValidator,
    upperCaseSpaceFieldValidator,
    dateGteFieldValidator(),
    dateLteFieldValidator(),
    timeGteFieldValidator(),
    timeLteFieldValidator(),
    uniqueFieldValidator(),
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
    welcomeScreenWidget,
    objectField,
    objectFieldRenderer
];
