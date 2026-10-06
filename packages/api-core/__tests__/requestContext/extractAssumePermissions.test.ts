import { describe } from "vitest";
import { it } from "vitest";
import { expect } from "vitest";
import { extractAssumePermissions } from "~/features/requestContext/extractAssumePermissions.js";

describe("extractAssumePermissions", () => {
    it("reads a role", () => {
        const headers = { "x-webiny-assume-permissions": "role:63f1a" };

        expect(extractAssumePermissions(headers)).toEqual({ type: "role", id: "63f1a" });
    });

    it("reads a team", () => {
        const headers = { "x-webiny-assume-permissions": "team:editors" };

        expect(extractAssumePermissions(headers)).toEqual({ type: "team", id: "editors" });
    });

    it("matches the header name regardless of casing", () => {
        const headers = { "X-Webiny-Assume-Permissions": "role:63f1a" };

        expect(extractAssumePermissions(headers)).toEqual({ type: "role", id: "63f1a" });
    });

    it("takes the first value when the header repeats", () => {
        const headers = { "x-webiny-assume-permissions": ["role:63f1a", "role:other"] };

        expect(extractAssumePermissions(headers)).toEqual({ type: "role", id: "63f1a" });
    });

    it("keeps a colon that is part of the id", () => {
        const headers = { "x-webiny-assume-permissions": "role:tenant:63f1a" };

        expect(extractAssumePermissions(headers)).toEqual({ type: "role", id: "tenant:63f1a" });
    });

    it.each([
        ["no headers at all", undefined],
        ["an absent header", {}],
        ["an empty value", { "x-webiny-assume-permissions": "" }],
        ["a missing separator", { "x-webiny-assume-permissions": "role" }],
        ["a missing id", { "x-webiny-assume-permissions": "role:" }],
        ["a missing type", { "x-webiny-assume-permissions": ":63f1a" }],
        ["an unknown type", { "x-webiny-assume-permissions": "user:63f1a" }]
    ])("returns null for %s", (_label, headers) => {
        expect(extractAssumePermissions(headers)).toBeNull();
    });
});
