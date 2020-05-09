import { FbBuilderFieldPlugin } from "@webiny/app-headless-cms/types";
import text from "./text";
import number from "./number";
import boolean from "./boolean";
import dateTime from "./dateTime";
const plugins: FbBuilderFieldPlugin[] = [text, number, boolean, dateTime];

export default plugins;
