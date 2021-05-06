import { Condition } from "../types";
import betweenCondition from "./between";
import containsCondition from "./contains";
import eqCondition from "./eq";
import gtCondition from "./gt";
import gteCondition from "./gte";
import ltCondition from "./lt";
import lteCondition from "./lte";
import inCondition from "./in";

const createConditions = (conditions: Condition[]): Record<string, Condition> => {
    /**
     * Built conditions that will match given values.
     */
    const values = conditions.reduce((collection, condition) => {
        collection[condition.key] = {
            ...condition,
            negate: false
        };
        return collection;
    }, {} as Record<string, Condition>);
    /**
     * Build conditions that will NOT match given values.
     * Basically we just add the negate option and change a key a bit.
     */
    return conditions.reduce((collection, condition) => {
        const key = `not_${condition.key}`;
        collection[key] = {
            ...condition,
            key,
            negate: true
        };
        return collection;
    }, values);
};
export default createConditions([
    eqCondition,
    gtCondition,
    gteCondition,
    ltCondition,
    lteCondition,
    inCondition,
    containsCondition,
    betweenCondition
]);
