import gte from "./gte";
import inValidator from "./in";
import lte from "./lte";
import maxLength from "./maxLength";
import minLength from "./minLength";
import pattern from "./pattern";
import required from "./required";
import patternPlugins from "./patternPlugins";
import dateLte from "./dateLte";
import dateGte from "./dateGte";
import timeLte from "./timeLte";
import timeGte from "./timeGte";
import unique from "./unique";

export default () => [
    gte,
    inValidator,
    lte,
    pattern,
    required,
    minLength,
    maxLength,
    patternPlugins,
    dateLte(),
    dateGte(),
    timeLte(),
    timeGte(),
    unique()
];
