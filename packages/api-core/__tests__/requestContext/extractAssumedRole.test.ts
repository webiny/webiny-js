import { describe, it, expect } from "vitest";
import { extractAssumedRole } from "~/features/requestContext/extractAssumedRole.js";

describe("extractAssumedRole", () => {
    it("reads a role", () => {
        const headers = { "x-webiny-assume-role": "role:63f1a" };

        expect(extractAssumedRole(headers)).toEqual({ type: "role", id: "63f1a" });
    });

    it("reads a team", () => {
        const headers = { "x-webiny-assume-role": "team:editors" };

        expect(extractAssumedRole(headers)).toEqual({ type: "team", id: "editors" });
    });

    it("matches the header name regardless of casing", () => {
        const headers = { "X-Webiny-Assume-Role": "role:63f1a" };

        expect(extractAssumedRole(headers)).toEqual({ type: "role", id: "63f1a" });
    });

    it("takes the first value when the header repeats", () => {
        const headers = { "x-webiny-assume-role": ["role:63f1a", "role:other"] };

        expect(extractAssumedRole(headers)).toEqual({ type: "role", id: "63f1a" });
    });

    it("keeps a colon that is part of the id", () => {
        const headers = { "x-webiny-assume-role": "role:tenant:63f1a" };

        expect(extractAssumedRole(headers)).toEqual({ type: "role", id: "tenant:63f1a" });
    });

    it.each([
        ["no headers at all", undefined],
        ["an absent header", {}],
        ["an empty value", { "x-webiny-assume-role": "" }],
        ["a missing separator", { "x-webiny-assume-role": "role" }],
        ["a missing id", { "x-webiny-assume-role": "role:" }],
        ["a missing type", { "x-webiny-assume-role": ":63f1a" }],
        ["an unknown type", { "x-webiny-assume-role": "user:63f1a" }]
    ])("returns null for %s", (_label, headers) => {
        expect(extractAssumedRole(headers)).toBeNull();
    });
});
