import eqFilter from "./eq";
import betweenFilter from "./between";
import inFilter from "./in";
import gtFilter from "./gt";
import gteFilter from "./gte";
import ltFilter from "./lt";
import lteFilter from "./lte";
import containsFilter from "./contains";

export default () => [
    eqFilter,
    inFilter,
    gtFilter,
    ltFilter,
    gteFilter,
    lteFilter,
    betweenFilter,
    containsFilter
];
