import { FbBuilderFieldPlugin } from "@webiny/app-headless-cms/types";
import text from "./text";
import number from "./number";
import boolean from "./boolean";
import dateTime from "./dateTime";
import richText from "./richText";
const plugins: FbBuilderFieldPlugin[] = [text, number, boolean, dateTime, richText];

export default plugins;
