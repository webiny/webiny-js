import { FbBuilderFieldPlugin } from "@webiny/app-form-builder/types";
import hidden from "./hidden";
import select from "./select";
import text from "./text";
import textarea from "./textarea";
import number from "./number";
import radioButtons from "./radioButtons";
import checkboxes from "./checkboxes";
import contact from "./contact";

const plugins: FbBuilderFieldPlugin[] = [
    hidden,
    select,
    text,
    textarea,
    number,
    radioButtons,
    checkboxes,
    ...contact
];

export default plugins;
