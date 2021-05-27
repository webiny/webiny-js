import WebinyError from "@webiny/error";
import { Condition } from "../types";
import betweenCondition from "./between";
import containsCondition from "./contains";
import eqCondition from "./eq";
import gtCondition from "./gt";
import gteCondition from "./gte";
import ltCondition from "./lt";
import lteCondition from "./lte";
import inCondition from "./in";

// const createConditions = (conditions: Condition[]): Record<string, Condition> => {
//     /**
//      * Built conditions that will match given values.
//      */
//     const values = conditions.reduce((collection, condition) => {
//         collection[condition.key] = {
//             ...condition,
//             negate: false
//         };
//         return collection;
//     }, {} as Record<string, Condition>);
//     /**
//      * Build conditions that will NOT match given values.
//      * Basically we just add the negate option and change a key a bit.
//      */
//     return conditions.reduce((collection, condition) => {
//         const key = `not_${condition.key}`;
//         collection[key] = {
//             ...condition,
//             key,
//             negate: true
//         };
//         return collection;
//     }, values);
// };
class ConditionContainer {
    private readonly _items: Map<string, Condition> = new Map();

    public register(item: Condition, withNegate?: boolean): void {
        this._items.set(item.key, item);
        if (!withNegate) {
            return;
        }
        const key = `not_${item.key}`;
        this._items.set(key, {
            ...item,
            key,
            negate: true
        });
    }

    public unregister(item: Condition | string): void {
        const key = typeof item === "string" ? item : item.key;
        this._items.delete(key);
        this._items.delete(`not_${key}`);
    }

    public clear(): void {
        this._items.clear();
    }

    public all(): Condition[] {
        return Array.from(this._items.values());
    }

    public get(key: string): Condition {
        if (!this._items.has(key)) {
            throw new WebinyError(`Unknown condition "${key}".`, "CONDITION_CONTAINER_ERROR", {
                key
            });
        }

        return this._items.get(key);
    }
}

const conditions = new ConditionContainer();

conditions.register(eqCondition, true);
conditions.register(gtCondition, true);
conditions.register(gteCondition, true);
conditions.register(ltCondition, true);
conditions.register(lteCondition, true);
conditions.register(inCondition, true);
conditions.register(containsCondition, true);
conditions.register(betweenCondition, true);

export default conditions;
// export default createConditions([
//     eqCondition,
//     gtCondition,
//     gteCondition,
//     ltCondition,
//     lteCondition,
//     inCondition,
//     containsCondition,
//     betweenCondition
// ]);
