import { CmsEditorFieldTypePlugin } from "@webiny/app-headless-cms/types";
import text from "./text";
import longText from "./longText";
import number from "./number";
import boolean from "./boolean";
import dateTime from "./dateTime";

const plugins: CmsEditorFieldTypePlugin[] = [text, number, boolean, dateTime, longText];

export default plugins;
