import text from "./text";
import longText from "./longText";
import ref from "./ref";
import number from "./number";
import boolean from "./boolean";
import datetime from "./datetime";
import richText from "./richText";
import file from "./file";
import object from "./object";

export const createGraphQLFields = () => [
    text,
    ref,
    number,
    datetime,
    boolean,
    longText,
    richText,
    file,
    object
];
