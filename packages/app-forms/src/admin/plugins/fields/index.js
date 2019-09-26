// @flow
import type { FormEditorFieldPluginType } from "@webiny/app-forms/types";
import hidden from "./hidden";
import select from "./select";
import text from "./text";
import textarea from "./textarea";
import number from "./number";
import radioButtons from "./radioButtons";
import checkboxes from "./checkboxes";
import contact from "./contact";

export default ([
    hidden,
    select,
    text,
    textarea,
    number,
    radioButtons,
    checkboxes,
    contact
]: Array<FormEditorFieldPluginType>);
