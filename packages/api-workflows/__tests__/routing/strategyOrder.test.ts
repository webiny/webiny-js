import { describe, expect, it } from "vitest";
import { getNamespaceApp } from "~/domain/routing/getNamespaceApp.js";
import { orderRoundRobin } from "~/domain/routing/orderRoundRobin.js";
import { orderLeastLoaded } from "~/domain/routing/orderLeastLoaded.js";

const ANNA = { id: "user-anna", displayName: "Anna" };
const BOB = { id: "user-bob", displayName: "Bob" };
const CARA = { id: "user-cara", displayName: "Cara" };
const CANDIDATES = [ANNA, BOB, CARA];

const ids = (users: typeof CANDIDATES): string[] => users.map(user => user.id);

describe("getNamespaceApp (D137)", () => {
    it("takes the prefix before the first dot", () => {
        expect(getNamespaceApp("cms.article")).toBe("cms");
        expect(getNamespaceApp("cms.blog.post")).toBe("cms");
        expect(getNamespaceApp("wb.page")).toBe("wb");
        expect(getNamespaceApp("plain")).toBe("plain");
    });
});

describe("orderRoundRobin (R115)", () => {
    it("starts with the first candidate without a last assignee", () => {
        expect(ids(orderRoundRobin(CANDIDATES, null))).toEqual([ANNA.id, BOB.id, CARA.id]);
    });

    it("starts after the last assignee by user id and wraps around", () => {
        expect(ids(orderRoundRobin(CANDIDATES, BOB.id))).toEqual([CARA.id, ANNA.id, BOB.id]);
        expect(ids(orderRoundRobin(CANDIDATES, CARA.id))).toEqual([ANNA.id, BOB.id, CARA.id]);
    });

    it("keeps the position of a last assignee who is no longer a candidate", () => {
        expect(ids(orderRoundRobin(CANDIDATES, "user-bea"))).toEqual([BOB.id, CARA.id, ANNA.id]);
        expect(ids(orderRoundRobin(CANDIDATES, "user-zed"))).toEqual([ANNA.id, BOB.id, CARA.id]);
    });

    it("does not change its input", () => {
        const input = [...CANDIDATES];

        orderRoundRobin(input, ANNA.id);

        expect(input).toEqual(CANDIDATES);
    });
});

describe("orderLeastLoaded (R115, D137)", () => {
    it("puts the fewest reviews first", () => {
        const loads = new Map([
            [ANNA.id, 2],
            [BOB.id, 1]
        ]);

        expect(ids(orderLeastLoaded(CANDIDATES, loads, new Map()))).toEqual([
            CARA.id,
            BOB.id,
            ANNA.id
        ]);
    });

    it("breaks ties by the least recent assignment, never assigned first, then by id", () => {
        const lastAssignedOn = new Map([
            [ANNA.id, "2026-10-09T11:00:00.000Z"],
            [BOB.id, "2026-10-09T10:00:00.000Z"]
        ]);

        expect(ids(orderLeastLoaded(CANDIDATES, new Map(), lastAssignedOn))).toEqual([
            CARA.id,
            BOB.id,
            ANNA.id
        ]);
        expect(ids(orderLeastLoaded(CANDIDATES, new Map(), new Map()))).toEqual([
            ANNA.id,
            BOB.id,
            CARA.id
        ]);
    });
});
