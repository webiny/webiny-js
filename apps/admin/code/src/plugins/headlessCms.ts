import headlessCmsPlugins from "@webiny/app-headless-cms/admin/plugins";
import textField from "@webiny/app-headless-cms/admin/plugins/fields/text";
import longTextField from "@webiny/app-headless-cms/admin/plugins/fields/longText";
import richTextField from "@webiny/app-headless-cms/admin/plugins/fields/richText";
import numberField from "@webiny/app-headless-cms/admin/plugins/fields/number";
import booleanField from "@webiny/app-headless-cms/admin/plugins/fields/boolean";
import dateTimeField from "@webiny/app-headless-cms/admin/plugins/fields/dateTime";
import fileField from "@webiny/app-headless-cms/admin/plugins/fields/file";
import refField from "@webiny/app-headless-cms/admin/plugins/fields/ref";
import objectField from "@webiny/app-headless-cms/admin/plugins/fields/object";

import numberFieldRenderer from "@webiny/app-headless-cms/admin/plugins/fieldRenderers/number";
import textFieldRenderer from "@webiny/app-headless-cms/admin/plugins/fieldRenderers/text";
import longTextFieldRenderer from "@webiny/app-headless-cms/admin/plugins/fieldRenderers/longText";
import richTextFieldRenderer from "@webiny/app-headless-cms/admin/plugins/fieldRenderers/richText";
import booleanFieldRenderer from "@webiny/app-headless-cms/admin/plugins/fieldRenderers/boolean";
import dateTimeFieldRenderer from "@webiny/app-headless-cms/admin/plugins/fieldRenderers/dateTime";
import fileFieldRenderer from "@webiny/app-headless-cms/admin/plugins/fieldRenderers/file";
import radioButtonsFieldRenderer from "@webiny/app-headless-cms/admin/plugins/fieldRenderers/radioButtons";
import selectFieldRenderer from "@webiny/app-headless-cms/admin/plugins/fieldRenderers/select";
import checkboxesFieldRenderer from "@webiny/app-headless-cms/admin/plugins/fieldRenderers/checkboxes";
import refFieldRenderer from "@webiny/app-headless-cms/admin/plugins/fieldRenderers/ref";
import objectFieldRenderer from "@webiny/app-headless-cms/admin/plugins/fieldRenderers/object";

import { createValidators } from "@webiny/app-headless-cms/admin/plugins/validators";
import { createFieldUiValidators } from "@webiny/app-headless-cms/admin/plugins/fieldValidators";

import welcomeScreenWidget from "@webiny/app-headless-cms/admin/plugins/welcomeScreenWidget";

import richTextEditor from "./headlessCMS/richTextEditor";

export default [
    headlessCmsPlugins(),
    richTextEditor,
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

    welcomeScreenWidget,
    objectField,
    objectFieldRenderer,
    /**
     * Field validators
     */
    createFieldUiValidators(),
    createValidators()
];
