import eqFilter from "./eq";
import notEqFilter from "./notEq";
import betweenFilter from "./between";
import notBetweenFilter from "./notBetween";
import inFilter from "./in";
import notInFilter from "./notIn";
import gtFilter from "./gt";
import notGtFilter from "./notGt";
import gteFilter from "./gte";
import notGteFilter from "./notGte";
import ltFilter from "./lt";
import notLtFilter from "./notLt";
import lteFilter from "./lte";
import notLteFilter from "./notLte";
import containsFilter from "./contains";
import notContainsFilter from "./notContains";

export default () => [
    eqFilter(),
    notEqFilter(),
    inFilter(),
    notInFilter(),
    gtFilter(),
    notGtFilter(),
    ltFilter(),
    notLtFilter(),
    gteFilter(),
    notGteFilter(),
    lteFilter(),
    notLteFilter(),
    betweenFilter(),
    notBetweenFilter(),
    containsFilter(),
    notContainsFilter()
];
