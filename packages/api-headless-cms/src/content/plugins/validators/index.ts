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
    dateGte()
];
