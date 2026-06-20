import headlessCmsPlugins from "~/admin/plugins/index.js";
import textField from "~/admin/plugins/fields/text.js";
import longTextField from "~/admin/plugins/fields/longText.js";
import richTextField from "~/admin/plugins/fields/richText.js";
import numberField from "~/admin/plugins/fields/number.js";
import booleanField from "~/admin/plugins/fields/boolean.js";
import dateTimeField from "~/admin/plugins/fields/dateTime.js";
import refField from "~/admin/plugins/fields/ref.js";
import objectField from "~/admin/plugins/fields/object.js";
import jsonField from "~/admin/plugins/fields/json.js";
import searchableJsonField from "~/admin/plugins/fields/searchableJson.js";

import editorGteFieldValidator from "~/admin/plugins/fieldValidators/gte.js";
import editorDateGteFieldValidator from "~/admin/plugins/fieldValidators/dateGte.js";
import editorDateLteFieldValidator from "~/admin/plugins/fieldValidators/dateLte.js";
import editorInValidatorFieldValidator from "~/admin/plugins/fieldValidators/in.js";
import editorLteFieldValidator from "~/admin/plugins/fieldValidators/lte.js";
import editorRequiredFieldValidator from "~/admin/plugins/fieldValidators/required.js";
import editorUniqueFieldValidator from "~/admin/plugins/fieldValidators/unique.js";
import editorMinLengthFieldValidator from "~/admin/plugins/fieldValidators/minLength.js";
import editorMaxLengthFieldValidator from "~/admin/plugins/fieldValidators/maxLength.js";
import editorPatternFieldValidator from "~/admin/plugins/fieldValidators/pattern.js";
import editorEmailFieldValidator from "~/admin/plugins/fieldValidators/patternPlugins/email.js";
import editorUrlFieldValidator from "~/admin/plugins/fieldValidators/patternPlugins/url.js";
import editorLowerCaseFieldValidator from "~/admin/plugins/fieldValidators/patternPlugins/lowerCase.js";
import editorUpperCaseFieldValidator from "~/admin/plugins/fieldValidators/patternPlugins/upperCase.js";
import editorLowerCaseSpaceFieldValidator from "~/admin/plugins/fieldValidators/patternPlugins/lowerCaseSpace.js";
import editorUpperCaseSpaceFieldValidator from "~/admin/plugins/fieldValidators/patternPlugins/upperCaseSpace.js";
import { dynamicZoneField } from "~/admin/plugins/fields/dynamicZone.js";
import { dynamicZoneFieldValidator } from "~/admin/plugins/fieldValidators/dynamicZone.js";
import { uiAlertField, uiSeparatorField, uiTabsField } from "~/admin/plugins/fields/ui/index.js";

export default [
    headlessCmsPlugins(),
    textField,
    longTextField,
    richTextField,
    numberField,
    booleanField,
    dateTimeField,
    refField,
    uiSeparatorField,
    uiAlertField,
    uiTabsField,
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
    objectField,
    dynamicZoneField,
    jsonField,
    searchableJsonField
];
