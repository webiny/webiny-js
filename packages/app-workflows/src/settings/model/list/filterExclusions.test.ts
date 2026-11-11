import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { createExclusion } from "~/settings/testing/settingsFixtures.js";
import { filterExclusions } from "./filterExclusions.js";

const NOW = Date.parse("2026-10-20T12:00:00.000Z");

const untilRemoved = createExclusion({ userId: "user-1", endsOn: null });
const future = createExclusion({ userId: "user-2", endsOn: "2026-10-20T21:59:59.999Z" });
const past = createExclusion({ userId: "user-3", endsOn: "2026-10-19T21:59:59.999Z" });
const endsNow = createExclusion({ userId: "user-4", endsOn: "2026-10-20T12:00:00.000Z" });

const LIST = [untilRemoved, future, past, endsNow];

describe("filterExclusions (R322)", () => {
    it("keeps the active entries on the Active tab, in order", () => {
        const result = filterExclusions(LIST, { tab: "active", userId: null, now: NOW });

        expect(result).toEqual([untilRemoved, future]);
    });

    it("keeps the expired entries on the Expired tab, an end at now included", () => {
        const result = filterExclusions(LIST, { tab: "expired", userId: null, now: NOW });

        expect(result).toEqual([past, endsNow]);
    });

    it("keeps every entry on the All tab", () => {
        const result = filterExclusions(LIST, { tab: "all", userId: null, now: NOW });

        expect(result).toEqual(LIST);
    });

    it("applies the user filter after the tab", () => {
        const onAll = filterExclusions(LIST, { tab: "all", userId: "user-3", now: NOW });
        const onActive = filterExclusions(LIST, { tab: "active", userId: "user-3", now: NOW });
        const onExpired = filterExclusions(LIST, { tab: "expired", userId: "user-3", now: NOW });

        expect(onAll).toEqual([past]);
        expect(onActive).toEqual([]);
        expect(onExpired).toEqual([past]);
    });
});
