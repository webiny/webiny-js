import richTextStorage from "./storage/richText";
import dateStorage from "./storage/date";
import plainObjectPath from "./path/plainObject";
import refPath from "./path/ref";
import datetimeTransformValue from "./transformValue/datetime";

export default () => [
    richTextStorage(),
    dateStorage(),
    plainObjectPath(),
    refPath(),
    datetimeTransformValue()
];
