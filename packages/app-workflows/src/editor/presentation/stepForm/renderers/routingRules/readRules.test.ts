import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { isObservable } from "mobx";
import { observable } from "mobx";
import { createRuleValue } from "~/editor/testing/ruleFixtures.js";
import { readRules } from "./readRules.js";

describe("readRules (R293)", () => {
    it("returns the rules of a plain array", () => {
        const rules = [createRuleValue({ id: "r1" }), createRuleValue({ id: "r2" })];

        expect(readRules(rules)).toEqual(rules);
    });

    it("turns an observable list of observable rules into plain data", () => {
        const rules = observable([
            createRuleValue({ id: "r1", preserved: { conditions: { a: 1 } } })
        ]);

        const plain = readRules(rules);

        expect(plain).toEqual([createRuleValue({ id: "r1", preserved: { conditions: { a: 1 } } })]);
        expect(isObservable(plain)).toBe(false);
        expect(isObservable(plain[0])).toBe(false);
        expect(isObservable(plain[0].preserved)).toBe(false);
    });

    it("is an empty list for anything that is not a list", () => {
        expect(readRules(null)).toEqual([]);
        expect(readRules(undefined)).toEqual([]);
        expect(readRules("r1")).toEqual([]);
        expect(readRules({ id: "r1" })).toEqual([]);
    });
});
