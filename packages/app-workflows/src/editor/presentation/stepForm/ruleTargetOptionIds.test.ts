import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { parseRuleTargetOptionId } from "./parseRuleTargetOptionId.js";
import { toRuleTargetOptionId } from "./toRuleTargetOptionId.js";

describe("rule target option ids (R307)", () => {
    it("writes the type and the id", () => {
        expect(toRuleTargetOptionId({ type: "user", id: "user-1" })).toBe("user:user-1");
        expect(toRuleTargetOptionId({ type: "team", id: "team-1" })).toBe("team:team-1");
    });

    it("reads back what it wrote", () => {
        expect(parseRuleTargetOptionId("user:user-1")).toEqual({ type: "user", id: "user-1" });
        expect(parseRuleTargetOptionId("team:team-1")).toEqual({ type: "team", id: "team-1" });
    });

    it("splits at the first colon only, so an id may contain one", () => {
        expect(parseRuleTargetOptionId("user:a:b")).toEqual({ type: "user", id: "a:b" });
    });

    it("is null for a type that is not user or team, an empty id and a value with no colon", () => {
        expect(parseRuleTargetOptionId("group:1")).toBeNull();
        expect(parseRuleTargetOptionId("user:")).toBeNull();
        expect(parseRuleTargetOptionId("user")).toBeNull();
        expect(parseRuleTargetOptionId("")).toBeNull();
    });
});
