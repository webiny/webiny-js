import { describe } from "vitest";
import { it } from "vitest";
import { expect } from "vitest";
import { extractPreviewTarget } from "~/features/requestContext/extractPreviewTarget.js";

describe("extractPreviewTarget", () => {
    it("reads a role", () => {
        const headers = { "x-webiny-preview-as": "role:63f1a" };

        expect(extractPreviewTarget(headers)).toEqual({ type: "role", id: "63f1a" });
    });

    it("reads a team", () => {
        const headers = { "x-webiny-preview-as": "team:editors" };

        expect(extractPreviewTarget(headers)).toEqual({ type: "team", id: "editors" });
    });

    it("matches the header name regardless of casing", () => {
        const headers = { "X-Webiny-Preview-As": "role:63f1a" };

        expect(extractPreviewTarget(headers)).toEqual({ type: "role", id: "63f1a" });
    });

    it("takes the first value when the header repeats", () => {
        const headers = { "x-webiny-preview-as": ["role:63f1a", "role:other"] };

        expect(extractPreviewTarget(headers)).toEqual({ type: "role", id: "63f1a" });
    });

    it("keeps a colon that is part of the id", () => {
        const headers = { "x-webiny-preview-as": "role:tenant:63f1a" };

        expect(extractPreviewTarget(headers)).toEqual({ type: "role", id: "tenant:63f1a" });
    });

    it.each([
        ["no headers at all", undefined],
        ["an absent header", {}],
        ["an empty value", { "x-webiny-preview-as": "" }],
        ["a missing separator", { "x-webiny-preview-as": "role" }],
        ["a missing id", { "x-webiny-preview-as": "role:" }],
        ["a missing type", { "x-webiny-preview-as": ":63f1a" }],
        ["an unknown type", { "x-webiny-preview-as": "user:63f1a" }]
    ])("returns null for %s", (_label, headers) => {
        expect(extractPreviewTarget(headers)).toBeNull();
    });
});
