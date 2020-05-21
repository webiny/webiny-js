import { CmsEditorFieldTypePlugin } from "@webiny/app-headless-cms/types";
import text from "./text";
import number from "./number";
import boolean from "./boolean";
import dateTime from "./dateTime";
import file from "./file";
const plugins: CmsEditorFieldTypePlugin[] = [text, number, boolean, dateTime, file];

export default plugins;
