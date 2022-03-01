import eqFilter from "./eq";
import betweenFilter from "./between";
import andInFilter from "./andIn";
import inFilter from "./in";
import gtFilter from "./gt";
import gteFilter from "./gte";
import ltFilter from "./lt";
import lteFilter from "./lte";
import containsFilter from "./contains";
import fuzzyFilter from "./fuzzy";
import startsWithFilter from "./startsWith";

export default () => [
    eqFilter,
    andInFilter,
    inFilter,
    gtFilter,
    ltFilter,
    gteFilter,
    lteFilter,
    betweenFilter,
    containsFilter,
    fuzzyFilter,
    startsWithFilter
];
