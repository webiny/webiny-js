import text from "./text";
import longText from "./longText";
import richText from "./richText";
import refPlugins from "./ref";
import number from "./number";
import boolean from "./boolean";
import datetimePlugins from "./datetime";
import json from "./json";
import file from "./file";

export default [
    text,
    ...refPlugins,
    number,
    boolean,
    ...datetimePlugins,
    richText,
    json,
    longText,
    file
];
