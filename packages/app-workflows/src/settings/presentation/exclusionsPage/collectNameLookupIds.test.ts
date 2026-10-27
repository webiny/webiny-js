import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import type { ExclusionUserName } from "~/settings/presentation/exclusionsPage/ExclusionsSource.js";
import { collectNameLookupIds } from "~/settings/presentation/exclusionsPage/collectNameLookupIds.js";
import { createExclusion } from "~/settings/testing/settingsFixtures.js";

const entry = (userId: string) => {
    return createExclusion({ userId, reason: null, endsOn: null });
};

describe("collectNameLookupIds (R321)", () => {
    it("returns every id of the list in order when nothing is known", () => {
        const list = [entry("user-b"), entry("user-a")];

        expect(collectNameLookupIds(list, new Map())).toEqual(["user-b", "user-a"]);
    });

    it("skips found and deleted users and keeps unknown ones", () => {
        const known = new Map<string, ExclusionUserName>();
        known.set("user-a", { userId: "user-a", label: "Ana", state: "found" });
        known.set("user-b", { userId: "user-b", label: "Deleted user", state: "deleted" });
        known.set("user-c", { userId: "user-c", label: "user-c", state: "unknown" });
        const list = [entry("user-a"), entry("user-b"), entry("user-c"), entry("user-d")];

        expect(collectNameLookupIds(list, known)).toEqual(["user-c", "user-d"]);
    });

    it("asks for an id once", () => {
        const list = [entry("user-a"), entry("user-a")];

        expect(collectNameLookupIds(list, new Map())).toEqual(["user-a"]);
    });
});
