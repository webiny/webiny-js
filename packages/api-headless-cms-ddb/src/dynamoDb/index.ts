import richTextStorage from "./storage/richText";
import longTextStorage from "./storage/longText";
import dateStorage from "./storage/date";
import { createPlainObjectPathPlugin } from "./path/plainObject";
import datetimeTransformValue from "./transformValue/datetime";

export default () => [
    richTextStorage(),
    longTextStorage(),
    dateStorage(),
    createPlainObjectPathPlugin(),
    datetimeTransformValue()
];
