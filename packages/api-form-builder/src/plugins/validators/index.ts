import gte from "./gte";
import dateGte from "./dateTimeGte";
import inValidator from "./in";
import lte from "./lte";
import dateLte from "./dateTimeLte";
import maxLength from "./maxLength";
import minLength from "./minLength";
import pattern from "./pattern";
import required from "./required";
import patternPlugins from "./patternPlugins";

export default [
    gte,
    dateGte,
    inValidator,
    lte,
    dateLte,
    pattern,
    required,
    minLength,
    maxLength,
    patternPlugins
];
