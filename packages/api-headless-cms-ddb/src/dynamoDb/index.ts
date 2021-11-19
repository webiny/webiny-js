import richTextStorage from "./storage/richText";
import longTextStorage from "./storage/longText";
import dateStorage from "./storage/date";
import plainObjectPath from "./path/plainObject";
import refPath from "./path/ref";
import datetimeTransformValue from "./transformValue/datetime";

export default () => [
    richTextStorage(),
    longTextStorage(),
    dateStorage(),
    plainObjectPath(),
    refPath(),
    datetimeTransformValue()
];
