### Task 5: List helpers

R318 (a save is the last-loaded list plus exactly one change), R322 (tabs, user filter after the tab, sort by name then user id, empty states), R328 (reason), R332 (filter options searched on the client by the label), Q62, Q64, Q65, Q66, D106; Review Focus 1 and 10 (`00-shared.md`). The 9c Global Constraints apply unchanged (read: one function or type per file, no nested call arguments, no multiline ternaries, design copy verbatim, targeted tests, the pre-commit chain).

Pure functions under `[AWS]/model/list/` (and the one constant in `[AWS]/model/constants.ts`) that the page and dialog presenters (Tasks 7, 9, 10) compose. Nothing here touches React, MobX or DI.

- **Reason** (`normaliseReason`, R328): trim; empty after trimming is `null`; longer than `REASON_MAX_LENGTH` (500) is cut to 500 after trimming (the input's `maxLength` stops typing past 500; the cut covers pasted or loaded text). Whitespace inside the text is kept.
- **One change per save** (R318, Review Focus 1): `upsertExclusion(list, entry)` replaces the entry with the same `userId` in place, else appends; `removeExclusion(list, userId)` drops that user's entry. Both return a new array, never mutate the input, and keep every other entry as the same object in the same order (the payload is the last-loaded list "byte-equal" except for the one change).
- **Tabs and filter** (`filterExclusions`, R322): the tab first (`active`: `isExclusionActive(exclusion, now)`; `expired`: not active; `all`: everything), then the user filter (`userId` null for all users). Order kept.
- **Sort** (`sortExclusions`, R322, Q66): by the row's name label (`labels.get(userId)`, the raw `userId` when the map has none), case-insensitive `localeCompare` with `sensitivity: "base"`; ties (e.g. two `Deleted user` rows, or `Ana` and `ana`) by `userId`. A new array.
- **Empty states** (`getExclusionsEmptyState`, R322, design DS:241):
  - no entries at all (`total === 0`): icon `person_off`, `No exclusions`, `Everyone in reviewing teams can be assigned automatically.`, Add shown;
  - Expired tab empty: icon `history`, `No expired exclusions`, `Exclusions move here after their end date.`, no Add;
  - Active or All tab empty: icon `person_off`, `No exclusions for this user` with a user filter, else `No active exclusions`; text `Everyone in reviewing teams can be assigned automatically.`; Add only without a user filter.
- **Filter option search** (`searchFilterOptions`, R332, Q64): the options whose label contains the search, case-insensitive, after trimming the search; an empty search returns every option. Only the label is searched (a deleted user's raw id is its `description`, shown to tell rows apart, not searched). Order kept, a new array.

Copy used (R322, `research-spec.md` 4.2, design DS:241): `No exclusions`, `Everyone in reviewing teams can be assigned automatically.`, `No expired exclusions`, `Exclusions move here after their end date.`, `No exclusions for this user`, `No active exclusions`.

**Files** (`[AWL]` = `packages/app-workflows/src/settings/model/list`):
- Create: `[AWL]/ExclusionTab.ts`
- Create: `packages/app-workflows/src/settings/model/constants.ts`
- Create: `[AWL]/normaliseReason.ts`, `[AWL]/normaliseReason.test.ts`
- Create: `[AWL]/upsertExclusion.ts`, `[AWL]/upsertExclusion.test.ts`
- Create: `[AWL]/removeExclusion.ts`, `[AWL]/removeExclusion.test.ts`
- Create: `[AWL]/FilterExclusionsParams.ts`
- Create: `[AWL]/filterExclusions.ts`, `[AWL]/filterExclusions.test.ts`
- Create: `[AWL]/sortExclusions.ts`, `[AWL]/sortExclusions.test.ts`
- Create: `[AWL]/ExclusionsEmptyVm.ts`
- Create: `[AWL]/EmptyStateParams.ts`
- Create: `[AWL]/getExclusionsEmptyState.ts`, `[AWL]/getExclusionsEmptyState.test.ts`
- Create: `[AWL]/searchFilterOptions.ts`, `[AWL]/searchFilterOptions.test.ts`

**Interfaces:**
- Consumes: Task 2 (`WorkflowExclusion` from `~/settings/domain/types.js`), Task 3 (`createExclusion` from `~/settings/testing/settingsFixtures.js`), Task 4 (`isExclusionActive` from `~/settings/model/time/isExclusionActive.js`), Task 6 (`PickerOption.note`; `createPickerOption` from `~/editor/testing/createPickerOption.js` defaults `note: null`). Existing (verified): `PickerOption` (`~/components/picker/PickerOption.js`).
- Produces (matches the contract): `ExclusionTab = "active" | "expired" | "all"`, `REASON_MAX_LENGTH = 500`, `normaliseReason(reason: string): string | null`, `upsertExclusion(list: WorkflowExclusion[], entry: WorkflowExclusion): WorkflowExclusion[]`, `removeExclusion(list: WorkflowExclusion[], userId: string): WorkflowExclusion[]`, `FilterExclusionsParams { tab: ExclusionTab; userId: string | null; now: number }`, `filterExclusions(list: WorkflowExclusion[], params: FilterExclusionsParams): WorkflowExclusion[]`, `sortExclusions(list: WorkflowExclusion[], labels: ReadonlyMap<string, string>): WorkflowExclusion[]`, `ExclusionsEmptyVm { icon: "person_off" | "history"; title: string; text: string; showAdd: boolean }`, `EmptyStateParams { total: number; tab: ExclusionTab; userFiltered: boolean }`, `getExclusionsEmptyState(params: EmptyStateParams): ExclusionsEmptyVm`, `searchFilterOptions(options: PickerOption[], search: string): PickerOption[]`. Consumed by Tasks 7, 9, 10 and 11.

**Test runner note:** admin package, `yarn test <path>` only, one file per command.

- [ ] **Step 1: Write the failing tests**

Create `packages/app-workflows/src/settings/model/list/normaliseReason.test.ts`:

```ts
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { normaliseReason } from "./normaliseReason.js";

describe("normaliseReason (R328, Q65)", () => {
    it("trims the reason and keeps the whitespace inside it", () => {
        expect(normaliseReason("  On  leave \n")).toBe("On  leave");
    });

    it("is null for an empty reason and for whitespace only", () => {
        expect(normaliseReason("")).toBeNull();
        expect(normaliseReason("   \n\t  ")).toBeNull();
    });

    it("keeps a reason of exactly 500 characters", () => {
        const reason = "a".repeat(500);

        expect(normaliseReason(reason)).toBe(reason);
    });

    it("cuts a longer reason to 500 characters after trimming", () => {
        const long = "b".repeat(600);
        const padded = `   ${long}   `;

        const result = normaliseReason(padded);

        expect(result).toBe("b".repeat(500));
        expect(result?.length).toBe(500);
    });
});
```

Create `packages/app-workflows/src/settings/model/list/upsertExclusion.test.ts`:

```ts
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { createExclusion } from "~/settings/testing/settingsFixtures.js";
import { upsertExclusion } from "./upsertExclusion.js";

const first = createExclusion({ userId: "user-1", reason: "On leave" });
const second = createExclusion({ userId: "user-2", endsOn: "2020-01-01T00:00:00.000Z" });
const third = createExclusion({ userId: "user-3" });

describe("upsertExclusion (R318)", () => {
    it("appends a new user's entry and keeps every other entry and its order", () => {
        const list = [first, second];
        const added = createExclusion({ userId: "user-9", reason: "Busy" });

        const result = upsertExclusion(list, added);

        expect(result).toEqual([first, second, added]);
        expect(result[0]).toBe(first);
        expect(result[1]).toBe(second);
        expect(result[2]).toBe(added);
    });

    it("replaces the entry with the same user in place and keeps every other entry", () => {
        const list = [first, second, third];
        const edited = createExclusion({ userId: "user-2", reason: "Back on Monday" });

        const result = upsertExclusion(list, edited);

        expect(result).toEqual([first, edited, third]);
        expect(result[0]).toBe(first);
        expect(result[1]).toBe(edited);
        expect(result[2]).toBe(third);
    });

    it("does not change the given list", () => {
        const list = [first, second];
        const edited = createExclusion({ userId: "user-1", reason: "Changed" });

        const result = upsertExclusion(list, edited);

        expect(result).not.toBe(list);
        expect(list).toEqual([first, second]);
        expect(list[0]).toBe(first);
    });

    it("adds to an empty list", () => {
        expect(upsertExclusion([], first)).toEqual([first]);
    });
});
```

Create `packages/app-workflows/src/settings/model/list/removeExclusion.test.ts`:

```ts
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { createExclusion } from "~/settings/testing/settingsFixtures.js";
import { removeExclusion } from "./removeExclusion.js";

const first = createExclusion({ userId: "user-1", reason: "On leave" });
const second = createExclusion({ userId: "user-2", endsOn: "2020-01-01T00:00:00.000Z" });
const third = createExclusion({ userId: "user-3" });

describe("removeExclusion (R318)", () => {
    it("drops only the user's entry and keeps every other entry and its order", () => {
        const result = removeExclusion([first, second, third], "user-2");

        expect(result).toEqual([first, third]);
        expect(result[0]).toBe(first);
        expect(result[1]).toBe(third);
    });

    it("keeps an expired entry of another user", () => {
        const result = removeExclusion([first, second], "user-1");

        expect(result).toEqual([second]);
        expect(result[0]).toBe(second);
    });

    it("returns an equal new list for a user who is not in it", () => {
        const list = [first, second];

        const result = removeExclusion(list, "user-9");

        expect(result).toEqual(list);
        expect(result).not.toBe(list);
    });

    it("does not change the given list", () => {
        const list = [first, second];

        removeExclusion(list, "user-1");

        expect(list).toEqual([first, second]);
    });
});
```

Create `packages/app-workflows/src/settings/model/list/filterExclusions.test.ts`:

```ts
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
```

Create `packages/app-workflows/src/settings/model/list/sortExclusions.test.ts`:

```ts
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { createExclusion } from "~/settings/testing/settingsFixtures.js";
import { sortExclusions } from "./sortExclusions.js";

describe("sortExclusions (R322, Q66)", () => {
    it("sorts by the name label, ignoring case", () => {
        const list = [
            createExclusion({ userId: "user-c" }),
            createExclusion({ userId: "user-a" }),
            createExclusion({ userId: "user-b" })
        ];
        const labels = new Map([
            ["user-a", "bea Novak"],
            ["user-b", "Cedo Ilić"],
            ["user-c", "Ana Kovač"]
        ]);

        const result = sortExclusions(list, labels);

        const ids = result.map(exclusion => exclusion.userId);
        expect(ids).toEqual(["user-c", "user-a", "user-b"]);
    });

    it("breaks a tie of equal labels by user id, deleted users included", () => {
        const list = [
            createExclusion({ userId: "user-z" }),
            createExclusion({ userId: "user-y" }),
            createExclusion({ userId: "user-x" })
        ];
        const labels = new Map([
            ["user-z", "Deleted user"],
            ["user-y", "Deleted user"],
            ["user-x", "deleted user"]
        ]);

        const result = sortExclusions(list, labels);

        const ids = result.map(exclusion => exclusion.userId);
        expect(ids).toEqual(["user-x", "user-y", "user-z"]);
    });

    it("sorts a user without a known label by the raw user id", () => {
        const list = [createExclusion({ userId: "b-raw-id" }), createExclusion({ userId: "user-1" })];
        const labels = new Map([["user-1", "Ana"]]);

        const result = sortExclusions(list, labels);

        const ids = result.map(exclusion => exclusion.userId);
        expect(ids).toEqual(["user-1", "b-raw-id"]);
    });

    it("returns a new list and leaves the given one as it was", () => {
        const first = createExclusion({ userId: "user-b" });
        const second = createExclusion({ userId: "user-a" });
        const list = [first, second];
        const labels = new Map([
            ["user-a", "Ana"],
            ["user-b", "Bea"]
        ]);

        const result = sortExclusions(list, labels);

        expect(result).not.toBe(list);
        expect(result[0]).toBe(second);
        expect(list[0]).toBe(first);
    });
});
```

Create `packages/app-workflows/src/settings/model/list/getExclusionsEmptyState.test.ts`:

```ts
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { getExclusionsEmptyState } from "./getExclusionsEmptyState.js";

const NO_ONE_EXCLUDED = "Everyone in reviewing teams can be assigned automatically.";

describe("getExclusionsEmptyState (R322, design DS:241)", () => {
    it("says No exclusions with Add when the list is empty, on any tab", () => {
        const expected = {
            icon: "person_off",
            title: "No exclusions",
            text: NO_ONE_EXCLUDED,
            showAdd: true
        };

        expect(getExclusionsEmptyState({ total: 0, tab: "active", userFiltered: false })).toEqual(
            expected
        );
        expect(getExclusionsEmptyState({ total: 0, tab: "expired", userFiltered: false })).toEqual(
            expected
        );
        expect(getExclusionsEmptyState({ total: 0, tab: "all", userFiltered: false })).toEqual(
            expected
        );
    });

    it("says No expired exclusions without Add on an empty Expired tab, with or without a user filter", () => {
        const expected = {
            icon: "history",
            title: "No expired exclusions",
            text: "Exclusions move here after their end date.",
            showAdd: false
        };

        expect(getExclusionsEmptyState({ total: 3, tab: "expired", userFiltered: false })).toEqual(
            expected
        );
        expect(getExclusionsEmptyState({ total: 3, tab: "expired", userFiltered: true })).toEqual(
            expected
        );
    });

    it("says No active exclusions with Add on an empty Active tab without a user filter", () => {
        expect(getExclusionsEmptyState({ total: 3, tab: "active", userFiltered: false })).toEqual({
            icon: "person_off",
            title: "No active exclusions",
            text: NO_ONE_EXCLUDED,
            showAdd: true
        });
    });

    it("says No exclusions for this user without Add on an empty Active or All tab with a user filter", () => {
        const expected = {
            icon: "person_off",
            title: "No exclusions for this user",
            text: NO_ONE_EXCLUDED,
            showAdd: false
        };

        expect(getExclusionsEmptyState({ total: 3, tab: "active", userFiltered: true })).toEqual(
            expected
        );
        expect(getExclusionsEmptyState({ total: 3, tab: "all", userFiltered: true })).toEqual(
            expected
        );
    });

    it("says No active exclusions with Add on an empty All tab without a user filter", () => {
        expect(getExclusionsEmptyState({ total: 3, tab: "all", userFiltered: false })).toEqual({
            icon: "person_off",
            title: "No active exclusions",
            text: NO_ONE_EXCLUDED,
            showAdd: true
        });
    });
});
```

Create `packages/app-workflows/src/settings/model/list/searchFilterOptions.test.ts`:

```ts
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { createPickerOption } from "~/editor/testing/createPickerOption.js";
import { searchFilterOptions } from "./searchFilterOptions.js";

const IVAN = createPickerOption({ id: "user-1", label: "Ivan Horvat" });
const ANA = createPickerOption({ id: "user-2", label: "Ana Kovač" });
const DELETED = createPickerOption({
    id: "user-9",
    label: "Deleted user",
    description: "user-9",
    muted: true,
    icon: "person_off"
});
const UNRESOLVED = createPickerOption({ id: "user-7", label: "user-7" });

const OPTIONS = [IVAN, ANA, DELETED, UNRESOLVED];

describe("searchFilterOptions (R332, Q64)", () => {
    it("returns every option, in order, for an empty or blank search", () => {
        const empty = searchFilterOptions(OPTIONS, "");
        const blank = searchFilterOptions(OPTIONS, "   ");

        expect(empty).toEqual(OPTIONS);
        expect(empty).not.toBe(OPTIONS);
        expect(blank).toEqual(OPTIONS);
    });

    it("keeps the options whose label contains the search, ignoring case", () => {
        expect(searchFilterOptions(OPTIONS, "IVAN")).toEqual([IVAN]);
        expect(searchFilterOptions(OPTIONS, "ko")).toEqual([ANA]);
        expect(searchFilterOptions(OPTIONS, " deleted ")).toEqual([DELETED]);
        expect(searchFilterOptions(OPTIONS, "an")).toEqual([IVAN, ANA]);
    });

    it("searches the label only, so a deleted user's id in the sub line does not match", () => {
        expect(searchFilterOptions(OPTIONS, "user-9")).toEqual([]);
        expect(searchFilterOptions(OPTIONS, "user-7")).toEqual([UNRESOLVED]);
    });
});
```

- [ ] **Step 2: Run the tests, expect failure**

```bash
yarn test packages/app-workflows/src/settings/model/list/normaliseReason.test.ts 2>&1 | tail -20
yarn test packages/app-workflows/src/settings/model/list/upsertExclusion.test.ts 2>&1 | tail -20
yarn test packages/app-workflows/src/settings/model/list/removeExclusion.test.ts 2>&1 | tail -20
yarn test packages/app-workflows/src/settings/model/list/filterExclusions.test.ts 2>&1 | tail -20
yarn test packages/app-workflows/src/settings/model/list/sortExclusions.test.ts 2>&1 | tail -20
yarn test packages/app-workflows/src/settings/model/list/getExclusionsEmptyState.test.ts 2>&1 | tail -20
yarn test packages/app-workflows/src/settings/model/list/searchFilterOptions.test.ts 2>&1 | tail -20
```

Expected: every file fails to load with `Failed to resolve import "./<function>.js"` for the function it tests; no test runs. Record the RED output.

- [ ] **Step 3: Implement**

Create `packages/app-workflows/src/settings/model/list/ExclusionTab.ts`:

```ts
// The list's tabs (R322): Active, Expired, All; Active is the default.
export type ExclusionTab = "active" | "expired" | "all";
```

Create `packages/app-workflows/src/settings/model/constants.ts`:

```ts
// The longest reason the page saves (R328, Q65): the input's `maxLength` and the cut of `normaliseReason`.
export const REASON_MAX_LENGTH = 500;
```

Create `packages/app-workflows/src/settings/model/list/normaliseReason.ts`:

```ts
import { REASON_MAX_LENGTH } from "~/settings/model/constants.js";

/*
 * The reason a save sends (R328, Q65): trimmed; `null` when nothing is left; cut to 500 characters
 * after trimming. The input's `maxLength` already stops typing past 500; the cut covers pasted or
 * loaded text.
 */
export const normaliseReason = (reason: string): string | null => {
    const trimmed = reason.trim();
    if (trimmed === "") {
        return null;
    }
    if (trimmed.length > REASON_MAX_LENGTH) {
        return trimmed.slice(0, REASON_MAX_LENGTH);
    }
    return trimmed;
};
```

Create `packages/app-workflows/src/settings/model/list/upsertExclusion.ts`:

```ts
import type { WorkflowExclusion } from "~/settings/domain/types.js";

/*
 * The list with `entry` in it (R318): it replaces the entry of the same user in place, else it is
 * appended. Every other entry stays the same object in the same order; the given list is not
 * changed.
 */
export const upsertExclusion = (
    list: WorkflowExclusion[],
    entry: WorkflowExclusion
): WorkflowExclusion[] => {
    const index = list.findIndex(exclusion => exclusion.userId === entry.userId);
    if (index === -1) {
        return [...list, entry];
    }
    const next = [...list];
    next[index] = entry;
    return next;
};
```

Create `packages/app-workflows/src/settings/model/list/removeExclusion.ts`:

```ts
import type { WorkflowExclusion } from "~/settings/domain/types.js";

// The list without the user's entry (R318); every other entry stays the same object in the same order.
export const removeExclusion = (
    list: WorkflowExclusion[],
    userId: string
): WorkflowExclusion[] => {
    return list.filter(exclusion => exclusion.userId !== userId);
};
```

Create `packages/app-workflows/src/settings/model/list/FilterExclusionsParams.ts`:

```ts
import type { ExclusionTab } from "./ExclusionTab.js";

export interface FilterExclusionsParams {
    tab: ExclusionTab;
    // The user filter; `null` for all users.
    userId: string | null;
    // The time the VM is computed at (R319).
    now: number;
}
```

Create `packages/app-workflows/src/settings/model/list/filterExclusions.ts`:

```ts
import type { WorkflowExclusion } from "~/settings/domain/types.js";
import { isExclusionActive } from "~/settings/model/time/isExclusionActive.js";
import type { ExclusionTab } from "./ExclusionTab.js";
import type { FilterExclusionsParams } from "./FilterExclusionsParams.js";

const matchesTab = (exclusion: WorkflowExclusion, tab: ExclusionTab, now: number): boolean => {
    if (tab === "all") {
        return true;
    }
    const active = isExclusionActive(exclusion, now);
    if (tab === "active") {
        return active;
    }
    return !active;
};

// The rows of a tab, then of the user filter, in the list's order (R322).
export const filterExclusions = (
    list: WorkflowExclusion[],
    params: FilterExclusionsParams
): WorkflowExclusion[] => {
    const { tab, userId, now } = params;

    return list.filter(exclusion => {
        if (!matchesTab(exclusion, tab, now)) {
            return false;
        }
        if (userId === null) {
            return true;
        }
        return exclusion.userId === userId;
    });
};
```

Create `packages/app-workflows/src/settings/model/list/sortExclusions.ts`:

```ts
import type { WorkflowExclusion } from "~/settings/domain/types.js";

const compareIds = (first: string, second: string): number => {
    if (first < second) {
        return -1;
    }
    if (first > second) {
        return 1;
    }
    return 0;
};

/*
 * The rows sorted by their name label (R322, Q66): case-insensitive, `sensitivity: "base"`; a user
 * with no label in `labels` sorts by the raw id. `Deleted user` is a label like any other; equal
 * labels sort by user id. A new list.
 */
export const sortExclusions = (
    list: WorkflowExclusion[],
    labels: ReadonlyMap<string, string>
): WorkflowExclusion[] => {
    const sorted = [...list];

    sorted.sort((first, second) => {
        const firstLabel = labels.get(first.userId) ?? first.userId;
        const secondLabel = labels.get(second.userId) ?? second.userId;
        const byLabel = firstLabel.localeCompare(secondLabel, undefined, { sensitivity: "base" });
        if (byLabel !== 0) {
            return byLabel;
        }
        return compareIds(first.userId, second.userId);
    });

    return sorted;
};
```

Create `packages/app-workflows/src/settings/model/list/ExclusionsEmptyVm.ts`:

```ts
// The empty state of the list (R322): the design icon, the title, the text and whether `Add exclusion` shows.
export interface ExclusionsEmptyVm {
    icon: "person_off" | "history";
    title: string;
    text: string;
    showAdd: boolean;
}
```

Create `packages/app-workflows/src/settings/model/list/EmptyStateParams.ts`:

```ts
import type { ExclusionTab } from "./ExclusionTab.js";

export interface EmptyStateParams {
    // How many entries the whole list has, on every tab.
    total: number;
    tab: ExclusionTab;
    // A user filter is set.
    userFiltered: boolean;
}
```

Create `packages/app-workflows/src/settings/model/list/getExclusionsEmptyState.ts`:

```ts
import type { EmptyStateParams } from "./EmptyStateParams.js";
import type { ExclusionsEmptyVm } from "./ExclusionsEmptyVm.js";

const NO_ONE_EXCLUDED = "Everyone in reviewing teams can be assigned automatically.";

/*
 * The empty state of the table (R322, design DS:241): no entries at all; an empty Expired tab;
 * an empty Active or All tab, with or without a user filter (`Add exclusion` only without one).
 */
export const getExclusionsEmptyState = (params: EmptyStateParams): ExclusionsEmptyVm => {
    const { total, tab, userFiltered } = params;

    if (total === 0) {
        return {
            icon: "person_off",
            title: "No exclusions",
            text: NO_ONE_EXCLUDED,
            showAdd: true
        };
    }
    if (tab === "expired") {
        return {
            icon: "history",
            title: "No expired exclusions",
            text: "Exclusions move here after their end date.",
            showAdd: false
        };
    }
    if (userFiltered) {
        return {
            icon: "person_off",
            title: "No exclusions for this user",
            text: NO_ONE_EXCLUDED,
            showAdd: false
        };
    }
    return {
        icon: "person_off",
        title: "No active exclusions",
        text: NO_ONE_EXCLUDED,
        showAdd: true
    };
};
```

Create `packages/app-workflows/src/settings/model/list/searchFilterOptions.ts`:

```ts
import type { PickerOption } from "~/components/picker/PickerOption.js";

/*
 * The user filter's options for a typed search (R332, Q64): the users in the list whose label
 * contains the trimmed search, ignoring case; every option for an empty search. Only the label is
 * searched. In order; a new list.
 */
export const searchFilterOptions = (options: PickerOption[], search: string): PickerOption[] => {
    const needle = search.trim().toLowerCase();
    if (needle === "") {
        return [...options];
    }
    return options.filter(option => option.label.toLowerCase().includes(needle));
};
```

- [ ] **Step 4: Run the new tests, expect pass**

Run the seven commands of Step 2 again.

Expected: all pass.

- [ ] **Step 5: Run the existing tests covering the changed code and type-check**

No existing file changes. Type-check:

```bash
yarn check:test:types -p app-workflows --report cli 2>&1 | tail -40
yarn build -p @webiny/app-workflows --no-cache 2>&1 | tail -30
```

Expected: no TypeScript errors.

- [ ] **Step 6: Pre-commit chain and commit**

```bash
git add .
yarn > /dev/null 2>&1
node scripts/generateTsConfigsInPackages.js
yarn adio
yarn check-ts-configs
yarn format:fix > /dev/null 2>&1
yarn lint:fix
yarn webiny sync-dependencies
yarn build -p @webiny/app-workflows --no-cache 2>&1 | tail -30
git add .
git checkout -- .gitleaks.toml
git commit -m "feat(app-workflows): add the exclusion list helpers" -m "Pure functions for the exclusions page: the reason trimmed and capped at 500 characters, adding, replacing and removing one entry while every other entry stays as it was, the tab and user filter, the sort by name then user id, the empty states and the client search of the user filter." -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>" -m "Claude-Session: https://claude.ai/code/session_01QU3bD1HmkGqCv78zmBsUFW"
```

If any step changes a file, fix it and rerun the chain from `git add .`. Never commit `.gitleaks.toml`, `docs/.reports` or `.superpowers`; never push, amend or revert.

## Contract notes

- **No conflicts with the code.** The empty-state strings live as module constants in `getExclusionsEmptyState.ts` (the function is their only user); Task 11's `exclusionsCopy.ts` holds the page strings and does not repeat these.
- **Empty list on any tab:** with `total === 0` the "No exclusions" state wins on every tab, also Expired (the design draws it for the empty page; a user filter cannot be set then, since the filter resets when its user leaves the list, R322).
- **Expired tab with a user filter** keeps the Expired text (the design has no filtered variant for it).
- **`removeExclusion` for an unknown user** returns an equal new list; the presenters never call it for a user who is not in the list.
- Size: small (seven small functions, seven test files).

## Review fixes (sub-phase review)

- No changes. Checked: the empty-state texts equal R322 (consistency item); the sort, filter and search expectations were traced by hand (`Ana` / `bea` / `Cedo`, equal `Deleted user` labels by id, an end at `now` is expired, label-only search); the names and paths Tasks 7, 9 and 10 import (`filterExclusions`, `sortExclusions`, `getExclusionsEmptyState`, `searchFilterOptions`, `upsertExclusion`, `removeExclusion`, `normaliseReason`, `REASON_MAX_LENGTH`, `ExclusionTab`, `ExclusionsEmptyVm`) match.
