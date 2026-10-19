### Task 4: Time helpers

R319 (viewer zone, end of the picked local day as UTC, `formatToParts` second truncation, DST re-check, active rule, today and `minDate`, `resolveEndsOn`), R320 (until label and hover), R337 (`minDate` is local midnight of today), R339 (fixed month names), A110 (full ICU in jsdom and node), Q63, D43, D73, D110, D124; Review Focus 2 and 3 (`00-shared.md`). The 9c Global Constraints apply unchanged; the 9c **Time** constraint is the core of this task: every date function takes `timeZone: string` and, where it needs the clock, `now: number` as arguments; only `resolveViewerTimeZone()` reads the environment; tests cover `Europe/Zagreb`, `America/New_York`, `Asia/Tokyo`, `UTC` and a DST change day (2026-10-25 in Zagreb, 2026-11-01 in New York), independent of the machine's zone.

Pure functions under `[AWS]/model/time/`, one function or type per file, each function with its own test file. Nothing here touches React, MobX or DI.

- **Viewer zone:** `resolveViewerTimeZone()` returns `Intl.DateTimeFormat().resolvedOptions().timeZone`, or `UTC` when that is empty or throws (D179). The same zone is used to compute, to show and to name the zone (R319).
- **Wall-clock parts (internal):** `getZonedDateParts(instant, timeZone)` reads year, month, day, hour, minute, second, the short weekday and ICU's short zone name with one `en-GB` `formatToParts` call (`hourCycle: "h23"`, so midnight is hour 0). Every other function builds on it, so the `formatToParts` reading is written once.
- **Offset:** `getTimeZoneOffset(instant, timeZone)` is local minus UTC in ms. `formatToParts` has no millisecond part, so the instant is truncated to its whole second (`instant - (instant mod 1000)`, with a non-negative remainder) before it is compared with the wall time; without this the offset of `…:59.999` is off by 999 ms and the end of a day lands on the next local day (R319).
- **End of a local day:** `getEndOfLocalDay("yyyy-MM-dd", timeZone)` is the UTC ISO string of 23:59:59.999 on that day in that zone: the wall time taken as UTC, minus the offset read there, re-checked at the result (a DST day ends at the right instant, D179).
- **Local dates:** `getLocalDate(instant, timeZone)` is the `yyyy-MM-dd` of an ISO instant in the zone (the Edit dialog's pre-fill); `getTodayLocalDate(now, timeZone)` is today's; `toLocalMidnight(date)` is the `Date` of local midnight of a `yyyy-MM-dd` in the browser (the date picker's `minDate`, R337: the picker compares browser-local calendar days); `isPastDate(date, today)` compares two `yyyy-MM-dd` strings.
- **Active:** `isExclusionActive(exclusion, now)` is `endsOn === null || Date.parse(endsOn) > now` (the server's `filterActiveExclusions` rule).
- **Until label** (`formatUntilLabel`, R320): `Until removed` without a date; `End of {d Mon yyyy}` when the local hour is 23 and the minute 59; else `{d Mon yyyy}, {HH:mm}`. Months are the fixed names `Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec` (R339: ICU's `en-GB` gives `Sept`).
- **Hover** (`formatUntilTitle`, R320): `{Ddd} {d} {Mon} {yyyy}, {HH:mm} {short zone name} ({IANA zone})`, e.g. `Tue 20 Oct 2026, 23:59 CEST (Europe/Zagreb)`, assembled from the parts (ICU puts a comma after the weekday, the design does not); `Until removed` without a date. With the zone unresolved (`UTC`) it reads `… 21:59 UTC (UTC)`. The short zone name is whatever ICU gives (`GMT-4` for New York in `en-GB`); tests assert Zagreb and UTC exactly and New York and Tokyo through the same `formatToParts` call.
- **Saving a date** (`resolveEndsOn`, R319, D124): the stored `endsOn` string unchanged when the picked date equals the pre-filled date; `null` when cleared; else the end of the newly picked day in the zone.

Copy used (from `research-spec.md` 4.2 and 4.5, R320, the contract): `Until removed`, `End of {date}`, `{d Mon yyyy}, {HH:mm}`, `{Ddd} {d} {Mon} {yyyy}, {HH:mm} {zone} ({tz})`, the month names `Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec`.

**Files** (`[AWT]` = `packages/app-workflows/src/settings/model/time`):
- Create: `[AWT]/resolveViewerTimeZone.ts`, `[AWT]/resolveViewerTimeZone.test.ts`
- Create: `[AWT]/ZonedDateParts.ts`
- Create: `[AWT]/getZonedDateParts.ts`, `[AWT]/getZonedDateParts.test.ts`
- Create: `[AWT]/getTimeZoneOffset.ts`, `[AWT]/getTimeZoneOffset.test.ts`
- Create: `[AWT]/getEndOfLocalDay.ts`, `[AWT]/getEndOfLocalDay.test.ts`
- Create: `[AWT]/getLocalDate.ts`, `[AWT]/getLocalDate.test.ts`
- Create: `[AWT]/getTodayLocalDate.ts`, `[AWT]/getTodayLocalDate.test.ts`
- Create: `[AWT]/toLocalMidnight.ts`, `[AWT]/toLocalMidnight.test.ts`
- Create: `[AWT]/isPastDate.ts`, `[AWT]/isPastDate.test.ts`
- Create: `[AWT]/isExclusionActive.ts`, `[AWT]/isExclusionActive.test.ts`
- Create: `[AWT]/timeTexts.ts`
- Create: `[AWT]/formatZonedDate.ts`, `[AWT]/formatZonedDate.test.ts`
- Create: `[AWT]/formatZonedTime.ts`, `[AWT]/formatZonedTime.test.ts`
- Create: `[AWT]/formatUntilLabel.ts`, `[AWT]/formatUntilLabel.test.ts`
- Create: `[AWT]/formatUntilTitle.ts`, `[AWT]/formatUntilTitle.test.ts`
- Create: `[AWT]/ResolveEndsOnParams.ts`
- Create: `[AWT]/resolveEndsOn.ts`, `[AWT]/resolveEndsOn.test.ts`

**Interfaces:**
- Consumes: Task 2 (`WorkflowExclusion` from `~/settings/domain/types.js`), Task 3 (`createExclusion` from `~/settings/testing/settingsFixtures.js`). Platform: `Intl.DateTimeFormat` with `timeZone`, `hourCycle`, `timeZoneName: "short"`, `formatToParts`, `resolvedOptions` (A110; checked in node 24 on the repo machine: Zagreb gives `CEST`, New York `GMT-4`, Tokyo `GMT+9`, UTC `UTC`).
- Produces (matches the contract): `resolveViewerTimeZone(): string`, `getTimeZoneOffset(instant: number, timeZone: string): number`, `getEndOfLocalDay(date: string, timeZone: string): string`, `getLocalDate(instant: string, timeZone: string): string`, `getTodayLocalDate(now: number, timeZone: string): string`, `toLocalMidnight(date: string): Date`, `isPastDate(date: string, today: string): boolean`, `isExclusionActive(exclusion: WorkflowExclusion, now: number): boolean`, `formatUntilLabel(endsOn: string | null, timeZone: string): string`, `formatUntilTitle(endsOn: string | null, timeZone: string): string`, `ResolveEndsOnParams { pickedDate: string | null; originalDate: string | null; originalEndsOn: string | null; timeZone: string }`, `resolveEndsOn(params: ResolveEndsOnParams): string | null`. Internal additions (Contract notes): `ZonedDateParts`, `getZonedDateParts`, `formatZonedDate`, `formatZonedTime`, `UNTIL_REMOVED_LABEL`, `SHORT_MONTH_NAMES`. Consumed by Task 5 (`isExclusionActive`), Task 7 (labels, `isExclusionActive`), Task 9 (`getLocalDate`, `getTodayLocalDate`, `toLocalMidnight`, `isPastDate`, `resolveEndsOn`), Task 11 (`resolveViewerTimeZone`).

**Test runner note:** admin package, `yarn test <path>` only, one file per command. Every zone is passed explicitly, so the results do not depend on the machine's zone; `toLocalMidnight` (the only reader of the local zone besides `resolveViewerTimeZone`) is asserted through local fields.

- [ ] **Step 1: Write the failing tests**

Create `packages/app-workflows/src/settings/model/time/resolveViewerTimeZone.test.ts`:

```ts
import { afterEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { resolveViewerTimeZone } from "./resolveViewerTimeZone.js";

// Makes `Intl.DateTimeFormat()` resolve to the given zone; the formatter is built before the spy.
const stubResolvedZone = (timeZone: string): void => {
    const format = new Intl.DateTimeFormat("en-GB", { timeZone: "UTC" });
    const options = format.resolvedOptions();
    const resolved: Intl.ResolvedDateTimeFormatOptions = { ...options, timeZone };
    vi.spyOn(format, "resolvedOptions").mockReturnValue(resolved);
    vi.spyOn(Intl, "DateTimeFormat").mockReturnValue(format);
};

describe("resolveViewerTimeZone (R319)", () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("returns the zone the browser resolves", () => {
        stubResolvedZone("Europe/Zagreb");

        expect(resolveViewerTimeZone()).toBe("Europe/Zagreb");
    });

    it("returns UTC when the browser resolves an empty zone", () => {
        stubResolvedZone("");

        expect(resolveViewerTimeZone()).toBe("UTC");
    });

    it("returns UTC when Intl throws", () => {
        vi.spyOn(Intl, "DateTimeFormat").mockImplementation(() => {
            throw new RangeError("Incorrect locale information provided");
        });

        expect(resolveViewerTimeZone()).toBe("UTC");
    });
});
```

Create `packages/app-workflows/src/settings/model/time/getZonedDateParts.test.ts`:

```ts
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { getZonedDateParts } from "./getZonedDateParts.js";

const END_OF_20_OCT_ZAGREB = Date.parse("2026-10-20T21:59:59.999Z");

const shortZoneName = (instant: number, timeZone: string): string => {
    const formatter = new Intl.DateTimeFormat("en-GB", { timeZone, timeZoneName: "short" });
    const parts = formatter.formatToParts(instant);
    const part = parts.find(candidate => candidate.type === "timeZoneName");
    if (!part) {
        return "";
    }
    return part.value;
};

describe("getZonedDateParts", () => {
    it("reads the wall-clock fields, the weekday and the zone name in Zagreb", () => {
        expect(getZonedDateParts(END_OF_20_OCT_ZAGREB, "Europe/Zagreb")).toEqual({
            year: 2026,
            month: 10,
            day: 20,
            hour: 23,
            minute: 59,
            second: 59,
            weekday: "Tue",
            zoneName: "CEST"
        });
    });

    it("reads the same instant in New York, Tokyo and UTC", () => {
        const newYork = getZonedDateParts(END_OF_20_OCT_ZAGREB, "America/New_York");
        const tokyo = getZonedDateParts(END_OF_20_OCT_ZAGREB, "Asia/Tokyo");
        const utc = getZonedDateParts(END_OF_20_OCT_ZAGREB, "UTC");

        expect(newYork).toMatchObject({ day: 20, hour: 17, minute: 59, weekday: "Tue" });
        expect(newYork.zoneName).toBe(shortZoneName(END_OF_20_OCT_ZAGREB, "America/New_York"));
        expect(tokyo).toMatchObject({ day: 21, hour: 6, minute: 59, weekday: "Wed" });
        expect(tokyo.zoneName).toBe(shortZoneName(END_OF_20_OCT_ZAGREB, "Asia/Tokyo"));
        expect(utc).toMatchObject({ day: 20, hour: 21, minute: 59, weekday: "Tue" });
        expect(utc.zoneName).toBe("UTC");
    });

    it("reads local midnight as hour 0", () => {
        const midnight = Date.parse("2026-10-19T22:00:00.000Z");

        expect(getZonedDateParts(midnight, "Europe/Zagreb")).toMatchObject({
            day: 20,
            hour: 0,
            minute: 0,
            second: 0
        });
    });
});
```

Create `packages/app-workflows/src/settings/model/time/getTimeZoneOffset.test.ts`:

```ts
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { getTimeZoneOffset } from "./getTimeZoneOffset.js";

const HOUR = 3600000;

describe("getTimeZoneOffset (R319)", () => {
    it("is local minus UTC in milliseconds, in summer and in winter", () => {
        const summer = Date.parse("2026-10-20T12:00:00.000Z");
        const winter = Date.parse("2026-12-01T12:00:00.000Z");

        expect(getTimeZoneOffset(summer, "Europe/Zagreb")).toBe(2 * HOUR);
        expect(getTimeZoneOffset(winter, "Europe/Zagreb")).toBe(1 * HOUR);
        expect(getTimeZoneOffset(summer, "America/New_York")).toBe(-4 * HOUR);
        expect(getTimeZoneOffset(winter, "America/New_York")).toBe(-5 * HOUR);
        expect(getTimeZoneOffset(summer, "Asia/Tokyo")).toBe(9 * HOUR);
        expect(getTimeZoneOffset(summer, "UTC")).toBe(0);
    });

    it("truncates the instant to its whole second, so .999 has the offset of the same second", () => {
        const withMilliseconds = Date.parse("2026-10-20T21:59:59.999Z");
        const wholeSecond = Date.parse("2026-10-20T21:59:59.000Z");

        expect(getTimeZoneOffset(withMilliseconds, "Europe/Zagreb")).toBe(
            getTimeZoneOffset(wholeSecond, "Europe/Zagreb")
        );
        expect(getTimeZoneOffset(withMilliseconds, "Europe/Zagreb")).toBe(2 * HOUR);
        expect(getTimeZoneOffset(withMilliseconds, "America/New_York")).toBe(-4 * HOUR);
    });

    it("changes at the DST end in Zagreb and in New York", () => {
        const beforeZagreb = Date.parse("2026-10-25T00:59:59.999Z");
        const afterZagreb = Date.parse("2026-10-25T01:00:00.000Z");
        const beforeNewYork = Date.parse("2026-11-01T05:59:59.999Z");
        const afterNewYork = Date.parse("2026-11-01T06:00:00.000Z");

        expect(getTimeZoneOffset(beforeZagreb, "Europe/Zagreb")).toBe(2 * HOUR);
        expect(getTimeZoneOffset(afterZagreb, "Europe/Zagreb")).toBe(1 * HOUR);
        expect(getTimeZoneOffset(beforeNewYork, "America/New_York")).toBe(-4 * HOUR);
        expect(getTimeZoneOffset(afterNewYork, "America/New_York")).toBe(-5 * HOUR);
    });
});
```

Create `packages/app-workflows/src/settings/model/time/getEndOfLocalDay.test.ts`:

```ts
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { getEndOfLocalDay } from "./getEndOfLocalDay.js";
import { getLocalDate } from "./getLocalDate.js";

describe("getEndOfLocalDay (R319, D179)", () => {
    it("is 23:59:59.999 of the picked day in the zone, as UTC", () => {
        expect(getEndOfLocalDay("2026-10-20", "Europe/Zagreb")).toBe("2026-10-20T21:59:59.999Z");
        expect(getEndOfLocalDay("2026-10-20", "Asia/Tokyo")).toBe("2026-10-20T14:59:59.999Z");
        expect(getEndOfLocalDay("2026-10-20", "UTC")).toBe("2026-10-20T23:59:59.999Z");
        expect(getEndOfLocalDay("2026-10-20", "America/New_York")).toBe(
            "2026-10-21T03:59:59.999Z"
        );
    });

    it("uses the offset after the change on a DST end day", () => {
        expect(getEndOfLocalDay("2026-10-25", "Europe/Zagreb")).toBe("2026-10-25T22:59:59.999Z");
        expect(getEndOfLocalDay("2026-11-01", "America/New_York")).toBe(
            "2026-11-02T04:59:59.999Z"
        );
    });

    it("uses the offset after the change on a DST start day", () => {
        expect(getEndOfLocalDay("2026-03-29", "Europe/Zagreb")).toBe("2026-03-29T21:59:59.999Z");
        expect(getEndOfLocalDay("2026-03-08", "America/New_York")).toBe(
            "2026-03-09T03:59:59.999Z"
        );
    });

    it("stays on the picked local day in every zone", () => {
        const zones = ["Europe/Zagreb", "America/New_York", "Asia/Tokyo", "UTC"];

        for (const zone of zones) {
            const endsOn = getEndOfLocalDay("2026-10-25", zone);

            expect(getLocalDate(endsOn, zone)).toBe("2026-10-25");
        }
    });
});
```

Create `packages/app-workflows/src/settings/model/time/getLocalDate.test.ts`:

```ts
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { getLocalDate } from "./getLocalDate.js";

describe("getLocalDate (R319)", () => {
    it("is the yyyy-MM-dd of the instant in the zone", () => {
        const instant = "2026-10-20T21:59:59.999Z";

        expect(getLocalDate(instant, "Europe/Zagreb")).toBe("2026-10-20");
        expect(getLocalDate(instant, "America/New_York")).toBe("2026-10-20");
        expect(getLocalDate(instant, "Asia/Tokyo")).toBe("2026-10-21");
        expect(getLocalDate(instant, "UTC")).toBe("2026-10-20");
    });

    it("counts local midnight to the new day and pads month and day", () => {
        expect(getLocalDate("2026-10-19T22:00:00.000Z", "Europe/Zagreb")).toBe("2026-10-20");
        expect(getLocalDate("2026-10-19T21:59:59.999Z", "Europe/Zagreb")).toBe("2026-10-19");
        expect(getLocalDate("2026-03-04T12:00:00.000Z", "UTC")).toBe("2026-03-04");
    });
});
```

Create `packages/app-workflows/src/settings/model/time/getTodayLocalDate.test.ts`:

```ts
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { getTodayLocalDate } from "./getTodayLocalDate.js";

describe("getTodayLocalDate (R319)", () => {
    it("is today in the zone, not in UTC", () => {
        const now = Date.parse("2026-10-19T22:30:00.000Z");

        expect(getTodayLocalDate(now, "Europe/Zagreb")).toBe("2026-10-20");
        expect(getTodayLocalDate(now, "Asia/Tokyo")).toBe("2026-10-20");
        expect(getTodayLocalDate(now, "America/New_York")).toBe("2026-10-19");
        expect(getTodayLocalDate(now, "UTC")).toBe("2026-10-19");
    });
});
```

Create `packages/app-workflows/src/settings/model/time/toLocalMidnight.test.ts`:

```ts
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { toLocalMidnight } from "./toLocalMidnight.js";

describe("toLocalMidnight (R337)", () => {
    it("is local midnight of the day in the browser", () => {
        const date = toLocalMidnight("2026-10-20");

        expect(date.getFullYear()).toBe(2026);
        expect(date.getMonth()).toBe(9);
        expect(date.getDate()).toBe(20);
        expect(date.getHours()).toBe(0);
        expect(date.getMinutes()).toBe(0);
        expect(date.getSeconds()).toBe(0);
        expect(date.getMilliseconds()).toBe(0);
    });

    it("reads the first and the last day of a year", () => {
        const first = toLocalMidnight("2027-01-01");
        const last = toLocalMidnight("2026-12-31");

        expect(first.getFullYear()).toBe(2027);
        expect(first.getMonth()).toBe(0);
        expect(first.getDate()).toBe(1);
        expect(last.getMonth()).toBe(11);
        expect(last.getDate()).toBe(31);
    });
});
```

Create `packages/app-workflows/src/settings/model/time/isPastDate.test.ts`:

```ts
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { isPastDate } from "./isPastDate.js";

describe("isPastDate (R319, QBZ-30)", () => {
    it("is true only for a day before today", () => {
        expect(isPastDate("2026-10-19", "2026-10-20")).toBe(true);
        expect(isPastDate("2025-12-31", "2026-01-01")).toBe(true);
        expect(isPastDate("2026-10-20", "2026-10-20")).toBe(false);
        expect(isPastDate("2026-10-21", "2026-10-20")).toBe(false);
    });
});
```

Create `packages/app-workflows/src/settings/model/time/isExclusionActive.test.ts`:

```ts
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { createExclusion } from "~/settings/testing/settingsFixtures.js";
import { isExclusionActive } from "./isExclusionActive.js";

const ENDS_ON = "2026-10-20T21:59:59.999Z";
const ENDS_AT = Date.parse(ENDS_ON);

describe("isExclusionActive (R319, D110)", () => {
    it("is active without an end date", () => {
        const exclusion = createExclusion({ endsOn: null });

        expect(isExclusionActive(exclusion, ENDS_AT)).toBe(true);
    });

    it("is active until the instant before its end", () => {
        const exclusion = createExclusion({ endsOn: ENDS_ON });

        expect(isExclusionActive(exclusion, ENDS_AT - 1)).toBe(true);
    });

    it("is expired at its end and after it", () => {
        const exclusion = createExclusion({ endsOn: ENDS_ON });

        expect(isExclusionActive(exclusion, ENDS_AT)).toBe(false);
        expect(isExclusionActive(exclusion, ENDS_AT + 1)).toBe(false);
    });
});
```

Create `packages/app-workflows/src/settings/model/time/formatZonedDate.test.ts`:

```ts
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import type { ZonedDateParts } from "./ZonedDateParts.js";
import { formatZonedDate } from "./formatZonedDate.js";

const createParts = (overrides: Partial<ZonedDateParts>): ZonedDateParts => {
    return {
        year: 2026,
        month: 10,
        day: 20,
        hour: 23,
        minute: 59,
        second: 59,
        weekday: "Tue",
        zoneName: "CEST",
        ...overrides
    };
};

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

describe("formatZonedDate (R339)", () => {
    it("writes d Mon yyyy without padding the day", () => {
        const parts = createParts({ day: 3, month: 9 });

        expect(formatZonedDate(parts)).toBe("3 Sep 2026");
    });

    it("uses the fixed three-letter month names", () => {
        MONTHS.forEach((name, index) => {
            const parts = createParts({ month: index + 1, day: 1 });

            expect(formatZonedDate(parts)).toBe(`1 ${name} 2026`);
        });
    });
});
```

Create `packages/app-workflows/src/settings/model/time/formatZonedTime.test.ts`:

```ts
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import type { ZonedDateParts } from "./ZonedDateParts.js";
import { formatZonedTime } from "./formatZonedTime.js";

const createParts = (hour: number, minute: number): ZonedDateParts => {
    return {
        year: 2026,
        month: 10,
        day: 20,
        hour,
        minute,
        second: 0,
        weekday: "Tue",
        zoneName: "CEST"
    };
};

describe("formatZonedTime", () => {
    it("writes a padded 24-hour HH:mm", () => {
        const morning = createParts(6, 5);
        const midnight = createParts(0, 0);
        const evening = createParts(23, 59);

        expect(formatZonedTime(morning)).toBe("06:05");
        expect(formatZonedTime(midnight)).toBe("00:00");
        expect(formatZonedTime(evening)).toBe("23:59");
    });
});
```

Create `packages/app-workflows/src/settings/model/time/formatUntilLabel.test.ts`:

```ts
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { formatUntilLabel } from "./formatUntilLabel.js";
import { getEndOfLocalDay } from "./getEndOfLocalDay.js";

const END_OF_20_OCT_ZAGREB = "2026-10-20T21:59:59.999Z";

describe("formatUntilLabel (R320, QBZ-95)", () => {
    it("says Until removed without an end date", () => {
        expect(formatUntilLabel(null, "Europe/Zagreb")).toBe("Until removed");
    });

    it("says End of the day when the end is at 23:59 in the viewer's zone", () => {
        expect(formatUntilLabel(END_OF_20_OCT_ZAGREB, "Europe/Zagreb")).toBe("End of 20 Oct 2026");
    });

    it("writes September as Sep, not as ICU's Sept (R339)", () => {
        expect(formatUntilLabel("2026-09-03T21:59:59.999Z", "Europe/Zagreb")).toBe(
            "End of 3 Sep 2026"
        );
    });

    it("writes the date and the time when the end is not at 23:59 in the viewer's zone", () => {
        expect(formatUntilLabel(END_OF_20_OCT_ZAGREB, "America/New_York")).toBe(
            "20 Oct 2026, 17:59"
        );
        expect(formatUntilLabel(END_OF_20_OCT_ZAGREB, "Asia/Tokyo")).toBe("21 Oct 2026, 06:59");
        expect(formatUntilLabel(END_OF_20_OCT_ZAGREB, "UTC")).toBe("20 Oct 2026, 21:59");
    });

    it("says End of for any instant in the 23:59 minute and not for 23:58", () => {
        expect(formatUntilLabel("2026-10-20T21:59:00.000Z", "Europe/Zagreb")).toBe(
            "End of 20 Oct 2026"
        );
        expect(formatUntilLabel("2026-10-20T21:58:59.999Z", "Europe/Zagreb")).toBe(
            "20 Oct 2026, 23:58"
        );
    });

    it("says End of the DST end day for an end picked on that day", () => {
        const zagreb = getEndOfLocalDay("2026-10-25", "Europe/Zagreb");
        const newYork = getEndOfLocalDay("2026-11-01", "America/New_York");

        expect(formatUntilLabel(zagreb, "Europe/Zagreb")).toBe("End of 25 Oct 2026");
        expect(formatUntilLabel(newYork, "America/New_York")).toBe("End of 1 Nov 2026");
    });
});
```

Create `packages/app-workflows/src/settings/model/time/formatUntilTitle.test.ts`:

```ts
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { formatUntilTitle } from "./formatUntilTitle.js";

const END_OF_20_OCT_ZAGREB = "2026-10-20T21:59:59.999Z";

const shortZoneName = (instant: string, timeZone: string): string => {
    const formatter = new Intl.DateTimeFormat("en-GB", { timeZone, timeZoneName: "short" });
    const time = Date.parse(instant);
    const parts = formatter.formatToParts(time);
    const part = parts.find(candidate => candidate.type === "timeZoneName");
    if (!part) {
        return "";
    }
    return part.value;
};

describe("formatUntilTitle (R320, QBZ-95)", () => {
    it("says Until removed without an end date", () => {
        expect(formatUntilTitle(null, "Europe/Zagreb")).toBe("Until removed");
    });

    it("writes the full time with the short zone name and the IANA zone, without a comma after the weekday", () => {
        const title = formatUntilTitle(END_OF_20_OCT_ZAGREB, "Europe/Zagreb");

        expect(title).toBe("Tue 20 Oct 2026, 23:59 CEST (Europe/Zagreb)");
        expect(title).not.toContain("Tue,");
    });

    it("shows UTC twice when the zone is the UTC fallback", () => {
        expect(formatUntilTitle(END_OF_20_OCT_ZAGREB, "UTC")).toBe(
            "Tue 20 Oct 2026, 21:59 UTC (UTC)"
        );
    });

    it("uses ICU's short zone name for New York and Tokyo", () => {
        const newYorkZone = shortZoneName(END_OF_20_OCT_ZAGREB, "America/New_York");
        const tokyoZone = shortZoneName(END_OF_20_OCT_ZAGREB, "Asia/Tokyo");

        expect(formatUntilTitle(END_OF_20_OCT_ZAGREB, "America/New_York")).toBe(
            `Tue 20 Oct 2026, 17:59 ${newYorkZone} (America/New_York)`
        );
        expect(formatUntilTitle(END_OF_20_OCT_ZAGREB, "Asia/Tokyo")).toBe(
            `Wed 21 Oct 2026, 06:59 ${tokyoZone} (Asia/Tokyo)`
        );
    });

    it("writes September as Sep (R339)", () => {
        expect(formatUntilTitle("2026-09-03T21:59:59.999Z", "Europe/Zagreb")).toBe(
            "Thu 3 Sep 2026, 23:59 CEST (Europe/Zagreb)"
        );
    });
});
```

Create `packages/app-workflows/src/settings/model/time/resolveEndsOn.test.ts`:

```ts
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { resolveEndsOn } from "./resolveEndsOn.js";

describe("resolveEndsOn (R319, D124)", () => {
    it("keeps the stored instant exactly when the date is unchanged, even if it is not at the end of a day", () => {
        const stored = "2026-10-20T15:00:00.000Z";

        const result = resolveEndsOn({
            pickedDate: "2026-10-20",
            originalDate: "2026-10-20",
            originalEndsOn: stored,
            timeZone: "Europe/Zagreb"
        });

        expect(result).toBe(stored);
    });

    it("is null when the date was cleared", () => {
        const result = resolveEndsOn({
            pickedDate: null,
            originalDate: "2026-10-20",
            originalEndsOn: "2026-10-20T21:59:59.999Z",
            timeZone: "Europe/Zagreb"
        });

        expect(result).toBeNull();
    });

    it("is null when there was no date and none is picked", () => {
        const result = resolveEndsOn({
            pickedDate: null,
            originalDate: null,
            originalEndsOn: null,
            timeZone: "Europe/Zagreb"
        });

        expect(result).toBeNull();
    });

    it("is the end of the newly picked day in the zone when the date changed", () => {
        const result = resolveEndsOn({
            pickedDate: "2026-10-21",
            originalDate: "2026-10-20",
            originalEndsOn: "2026-10-20T15:00:00.000Z",
            timeZone: "Europe/Zagreb"
        });

        expect(result).toBe("2026-10-21T21:59:59.999Z");
    });

    it("is the end of the picked day for a new entry", () => {
        const result = resolveEndsOn({
            pickedDate: "2026-11-01",
            originalDate: null,
            originalEndsOn: null,
            timeZone: "America/New_York"
        });

        expect(result).toBe("2026-11-02T04:59:59.999Z");
    });
});
```

- [ ] **Step 2: Run the tests, expect failure**

```bash
yarn test packages/app-workflows/src/settings/model/time/resolveViewerTimeZone.test.ts 2>&1 | tail -20
yarn test packages/app-workflows/src/settings/model/time/getZonedDateParts.test.ts 2>&1 | tail -20
yarn test packages/app-workflows/src/settings/model/time/getTimeZoneOffset.test.ts 2>&1 | tail -20
yarn test packages/app-workflows/src/settings/model/time/getEndOfLocalDay.test.ts 2>&1 | tail -20
yarn test packages/app-workflows/src/settings/model/time/getLocalDate.test.ts 2>&1 | tail -20
yarn test packages/app-workflows/src/settings/model/time/getTodayLocalDate.test.ts 2>&1 | tail -20
yarn test packages/app-workflows/src/settings/model/time/toLocalMidnight.test.ts 2>&1 | tail -20
yarn test packages/app-workflows/src/settings/model/time/isPastDate.test.ts 2>&1 | tail -20
yarn test packages/app-workflows/src/settings/model/time/isExclusionActive.test.ts 2>&1 | tail -20
yarn test packages/app-workflows/src/settings/model/time/formatZonedDate.test.ts 2>&1 | tail -20
yarn test packages/app-workflows/src/settings/model/time/formatZonedTime.test.ts 2>&1 | tail -20
yarn test packages/app-workflows/src/settings/model/time/formatUntilLabel.test.ts 2>&1 | tail -20
yarn test packages/app-workflows/src/settings/model/time/formatUntilTitle.test.ts 2>&1 | tail -20
yarn test packages/app-workflows/src/settings/model/time/resolveEndsOn.test.ts 2>&1 | tail -20
```

Expected: every file fails to load with `Failed to resolve import "./<function>.js"` for the function it tests; no test runs. Record the RED output.

- [ ] **Step 3: Implement**

Create `packages/app-workflows/src/settings/model/time/resolveViewerTimeZone.ts`:

```ts
const FALLBACK_TIME_ZONE = "UTC";

/*
 * The viewer's IANA timezone, the one zone the settings page computes, shows and names dates in
 * (R319). `UTC` when the browser resolves none or `Intl` throws (D179). The only time function
 * that reads the environment.
 */
export const resolveViewerTimeZone = (): string => {
    try {
        const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        if (!timeZone) {
            return FALLBACK_TIME_ZONE;
        }
        return timeZone;
    } catch {
        return FALLBACK_TIME_ZONE;
    }
};
```

Create `packages/app-workflows/src/settings/model/time/ZonedDateParts.ts`:

```ts
// The wall-clock fields of an instant in one timezone, read with `formatToParts` (R319, R320).
export interface ZonedDateParts {
    year: number;
    // 1 to 12.
    month: number;
    day: number;
    // 0 to 23.
    hour: number;
    minute: number;
    second: number;
    // `Mon` to `Sun`.
    weekday: string;
    // ICU's short `en-GB` name, e.g. `CEST`, `GMT-4`, `UTC`.
    zoneName: string;
}
```

Create `packages/app-workflows/src/settings/model/time/getZonedDateParts.ts`:

```ts
import type { ZonedDateParts } from "./ZonedDateParts.js";

const readPart = (parts: Intl.DateTimeFormatPart[], type: Intl.DateTimeFormatPartTypes): string => {
    const part = parts.find(candidate => candidate.type === type);
    if (!part) {
        return "";
    }
    return part.value;
};

/*
 * The wall-clock fields of `instant` in `timeZone` from one `en-GB` `formatToParts` call (R319,
 * R320). `hourCycle: "h23"` makes midnight hour 0. There is no millisecond part; callers that
 * compare with the instant truncate it to its second (`getTimeZoneOffset`).
 */
export const getZonedDateParts = (instant: number, timeZone: string): ZonedDateParts => {
    const formatter = new Intl.DateTimeFormat("en-GB", {
        timeZone,
        weekday: "short",
        year: "numeric",
        month: "numeric",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hourCycle: "h23",
        timeZoneName: "short"
    });
    const parts = formatter.formatToParts(instant);
    const year = readPart(parts, "year");
    const month = readPart(parts, "month");
    const day = readPart(parts, "day");
    const hour = readPart(parts, "hour");
    const minute = readPart(parts, "minute");
    const second = readPart(parts, "second");

    return {
        year: Number(year),
        month: Number(month),
        day: Number(day),
        hour: Number(hour),
        minute: Number(minute),
        second: Number(second),
        weekday: readPart(parts, "weekday"),
        zoneName: readPart(parts, "timeZoneName")
    };
};
```

Create `packages/app-workflows/src/settings/model/time/getTimeZoneOffset.ts`:

```ts
import { getZonedDateParts } from "./getZonedDateParts.js";

const MILLISECONDS_PER_SECOND = 1000;

/*
 * The offset of `timeZone` from UTC at `instant`, in milliseconds (local minus UTC: 7200000 for
 * CEST). `formatToParts` has no millisecond part, so the instant is truncated to its whole second
 * before it is compared with the wall time; otherwise the offset of `…:59.999` is off by 999 ms
 * and an end of day lands on the next local day (R319). The remainder is kept non-negative so an
 * instant before 1970 truncates the same way.
 */
export const getTimeZoneOffset = (instant: number, timeZone: string): number => {
    const parts = getZonedDateParts(instant, timeZone);
    const wallTime = Date.UTC(
        parts.year,
        parts.month - 1,
        parts.day,
        parts.hour,
        parts.minute,
        parts.second
    );
    const remainder =
        ((instant % MILLISECONDS_PER_SECOND) + MILLISECONDS_PER_SECOND) % MILLISECONDS_PER_SECOND;
    const wholeSecond = instant - remainder;

    return wallTime - wholeSecond;
};
```

Create `packages/app-workflows/src/settings/model/time/getEndOfLocalDay.ts`:

```ts
import { getTimeZoneOffset } from "./getTimeZoneOffset.js";

/*
 * The UTC ISO string of 23:59:59.999 on `date` (`yyyy-MM-dd`) in `timeZone` (R319, D179). The
 * offset is read at the wall time taken as UTC and re-checked at the result, so on a day the zone
 * changes its offset the end still falls at 23:59:59.999 local.
 */
export const getEndOfLocalDay = (date: string, timeZone: string): string => {
    const [year, month, day] = date.split("-").map(Number);
    const wallTime = Date.UTC(year, month - 1, day, 23, 59, 59, 999);
    const firstOffset = getTimeZoneOffset(wallTime, timeZone);
    let instant = wallTime - firstOffset;

    const checkedOffset = getTimeZoneOffset(instant, timeZone);
    if (checkedOffset !== firstOffset) {
        instant = wallTime - checkedOffset;
    }

    return new Date(instant).toISOString();
};
```

Create `packages/app-workflows/src/settings/model/time/getLocalDate.ts`:

```ts
import { getZonedDateParts } from "./getZonedDateParts.js";

const pad = (value: number): string => {
    return String(value).padStart(2, "0");
};

// The `yyyy-MM-dd` of an ISO instant in `timeZone`: the date the Edit dialog pre-fills (R319).
export const getLocalDate = (instant: string, timeZone: string): string => {
    const time = Date.parse(instant);
    const parts = getZonedDateParts(time, timeZone);
    const month = pad(parts.month);
    const day = pad(parts.day);

    return `${parts.year}-${month}-${day}`;
};
```

Create `packages/app-workflows/src/settings/model/time/getTodayLocalDate.ts`:

```ts
import { getLocalDate } from "./getLocalDate.js";

// Today's `yyyy-MM-dd` in `timeZone` at `now`: the earliest pickable day (R319).
export const getTodayLocalDate = (now: number, timeZone: string): string => {
    const instant = new Date(now).toISOString();
    return getLocalDate(instant, timeZone);
};
```

Create `packages/app-workflows/src/settings/model/time/toLocalMidnight.ts`:

```ts
/*
 * Local midnight of `date` (`yyyy-MM-dd`) in the browser: the date picker's `minDate`, because the
 * picker's calendar compares browser-local days (R337). The browser's zone is the viewer's zone
 * the page uses, except when that is the `UTC` fallback.
 */
export const toLocalMidnight = (date: string): Date => {
    const [year, month, day] = date.split("-").map(Number);
    return new Date(year, month - 1, day);
};
```

Create `packages/app-workflows/src/settings/model/time/isPastDate.ts`:

```ts
// Whether `date` is a day before `today`; both `yyyy-MM-dd`, which compare as strings (R319).
export const isPastDate = (date: string, today: string): boolean => {
    return date < today;
};
```

Create `packages/app-workflows/src/settings/model/time/isExclusionActive.ts`:

```ts
import type { WorkflowExclusion } from "~/settings/domain/types.js";

// Active without an end date or while the end is still ahead, the server's `filterActiveExclusions` rule (R319).
export const isExclusionActive = (exclusion: WorkflowExclusion, now: number): boolean => {
    if (exclusion.endsOn === null) {
        return true;
    }
    const endsAt = Date.parse(exclusion.endsOn);
    return endsAt > now;
};
```

Create `packages/app-workflows/src/settings/model/time/timeTexts.ts`:

```ts
// The Until cell and its hover for an exclusion without an end date (design DS:201-202).
export const UNTIL_REMOVED_LABEL = "Until removed";

// Fixed short month names, January first: ICU's `en-GB` gives `Sept` for September (R339).
export const SHORT_MONTH_NAMES: readonly string[] = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec"
];
```

Create `packages/app-workflows/src/settings/model/time/formatZonedDate.ts`:

```ts
import type { ZonedDateParts } from "./ZonedDateParts.js";
import { SHORT_MONTH_NAMES } from "./timeTexts.js";

// The `d Mon yyyy` of the until label and hover, with the fixed month names (R320, R339).
export const formatZonedDate = (parts: ZonedDateParts): string => {
    const month = SHORT_MONTH_NAMES[parts.month - 1];
    return `${parts.day} ${month} ${parts.year}`;
};
```

Create `packages/app-workflows/src/settings/model/time/formatZonedTime.ts`:

```ts
import type { ZonedDateParts } from "./ZonedDateParts.js";

const pad = (value: number): string => {
    return String(value).padStart(2, "0");
};

// The 24-hour `HH:mm` of the until label and hover (R320).
export const formatZonedTime = (parts: ZonedDateParts): string => {
    const hour = pad(parts.hour);
    const minute = pad(parts.minute);
    return `${hour}:${minute}`;
};
```

Create `packages/app-workflows/src/settings/model/time/formatUntilLabel.ts`:

```ts
import { formatZonedDate } from "./formatZonedDate.js";
import { formatZonedTime } from "./formatZonedTime.js";
import { getZonedDateParts } from "./getZonedDateParts.js";
import { UNTIL_REMOVED_LABEL } from "./timeTexts.js";

/*
 * The Until cell (R320, QBZ-95): `Until removed` without a date; `End of {d Mon yyyy}` when the end
 * falls in the 23:59 minute of the viewer's zone; else `{d Mon yyyy}, {HH:mm}` in that zone.
 */
export const formatUntilLabel = (endsOn: string | null, timeZone: string): string => {
    if (endsOn === null) {
        return UNTIL_REMOVED_LABEL;
    }
    const instant = Date.parse(endsOn);
    const parts = getZonedDateParts(instant, timeZone);
    const date = formatZonedDate(parts);

    if (parts.hour === 23 && parts.minute === 59) {
        return `End of ${date}`;
    }

    const time = formatZonedTime(parts);
    return `${date}, ${time}`;
};
```

Create `packages/app-workflows/src/settings/model/time/formatUntilTitle.ts`:

```ts
import { formatZonedDate } from "./formatZonedDate.js";
import { formatZonedTime } from "./formatZonedTime.js";
import { getZonedDateParts } from "./getZonedDateParts.js";
import { UNTIL_REMOVED_LABEL } from "./timeTexts.js";

/*
 * The Until cell's hover (R320, QBZ-95): `{Ddd} {d} {Mon} {yyyy}, {HH:mm} {zone} ({IANA zone})`,
 * e.g. `Tue 20 Oct 2026, 23:59 CEST (Europe/Zagreb)`. Built from the parts, because ICU writes a
 * comma after the weekday and the design does not. `Until removed` without a date.
 */
export const formatUntilTitle = (endsOn: string | null, timeZone: string): string => {
    if (endsOn === null) {
        return UNTIL_REMOVED_LABEL;
    }
    const instant = Date.parse(endsOn);
    const parts = getZonedDateParts(instant, timeZone);
    const date = formatZonedDate(parts);
    const time = formatZonedTime(parts);

    return `${parts.weekday} ${date}, ${time} ${parts.zoneName} (${timeZone})`;
};
```

Create `packages/app-workflows/src/settings/model/time/ResolveEndsOnParams.ts`:

```ts
export interface ResolveEndsOnParams {
    // The date in the field, `yyyy-MM-dd`; `null` when cleared or never set.
    pickedDate: string | null;
    // The date the field was pre-filled with (`getLocalDate` of the stored end); `null` for none.
    originalDate: string | null;
    // The stored end as loaded; `null` for none.
    originalEndsOn: string | null;
    timeZone: string;
}
```

Create `packages/app-workflows/src/settings/model/time/resolveEndsOn.ts`:

```ts
import type { ResolveEndsOnParams } from "./ResolveEndsOnParams.js";
import { getEndOfLocalDay } from "./getEndOfLocalDay.js";

/*
 * The `endsOn` a save sends (R319, D124): the stored string unchanged when the date was not
 * changed (also an end that is not at the end of a day, e.g. saved in another zone); `null` when
 * cleared; else the end of the newly picked day in the viewer's zone.
 */
export const resolveEndsOn = (params: ResolveEndsOnParams): string | null => {
    const { pickedDate, originalDate, originalEndsOn, timeZone } = params;

    if (pickedDate === null) {
        return null;
    }
    if (pickedDate === originalDate && originalEndsOn !== null) {
        return originalEndsOn;
    }
    return getEndOfLocalDay(pickedDate, timeZone);
};
```

- [ ] **Step 4: Run the new tests, expect pass**

Run the fourteen commands of Step 2 again.

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
git commit -m "feat(app-workflows): add the exclusion time helpers" -m "Pure functions for the viewer's timezone with a UTC fallback, the end of a local day as a UTC instant across DST changes, local dates, the active rule, the until label and its hover with fixed month names, and the end date a save sends, keeping the stored instant when the date is unchanged." -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>" -m "Claude-Session: https://claude.ai/code/session_01QU3bD1HmkGqCv78zmBsUFW"
```

If any step changes a file, fix it and rerun the chain from `git add .`. Never commit `.gitleaks.toml`, `docs/.reports` or `.superpowers`; never push, amend or revert.

## Contract notes

- **Internal files beyond the contract list:** `ZonedDateParts.ts`, `getZonedDateParts.ts` (the one `formatToParts` reading every function uses, instead of five copies), `formatZonedDate.ts` and `formatZonedTime.ts` (shared by the label and the hover), and `timeTexts.ts` (`UNTIL_REMOVED_LABEL`, `SHORT_MONTH_NAMES`, used by two files each). One function or type per file is kept; `timeTexts.ts` is a constants file like `components/picker/pickerTexts.ts`. Nothing outside this folder needs them.
- **New York offset at the end of 20 Oct:** the contract's exact list has no New York value for 2026-10-20; the test adds `2026-10-21T03:59:59.999Z` (EDT, UTC-4), checked with node's ICU. Also checked: the DST start days (`2026-03-29` Zagreb gives `2026-03-29T21:59:59.999Z`, `2026-03-08` New York gives `2026-03-09T03:59:59.999Z`).
- **`resolveEndsOn` with an equal date but no stored end** (not reachable: the pre-filled date comes from the stored end) computes the end of the picked day rather than returning `null`.
- **`resolveViewerTimeZone` test** replaces `Intl.DateTimeFormat` with `vi.spyOn` (restored after each test); the function calls `Intl.DateTimeFormat()` without `new`, which the spy answers with the stubbed formatter.
- **No guard for an unparsable `endsOn`:** the server normalises every stored `endsOn` to ISO (`WorkflowSettingsValidator`), so the labels do not special-case `NaN`.
- Size: medium (twelve small functions, fourteen small test files).

## Review fixes (sub-phase review)

- No code changes. Verified by running the code: in node 24.18 every expected string holds (`getEndOfLocalDay` for Zagreb, New York, Tokyo, UTC, both DST end days and both DST start days; offsets around both DST ends; Zagreb `CEST`, New York `GMT-4`, Tokyo `GMT+9`, UTC `UTC`; `Thu` for 3 Sep 2026, `Tue` for 20 Oct 2026, hour 0 at Zagreb midnight). The `resolveViewerTimeZone` test (`vi.spyOn(Intl, "DateTimeFormat")` with `mockReturnValue` and a throwing `mockImplementation`, restored by `vi.restoreAllMocks()`) was run as written with the repo's Vitest 4.1.11 in jsdom and passes.
- Consistency items: `isPastDate` is strict (today allowed) and `resolveEndsOn` returns the stored instant when the date is unchanged, as Task 9 expects; the strings Tasks 7 and 11 pin (`End of 20 Oct 2026`, `End of 10 Oct 2026`, `Tue 20 Oct 2026, 23:59 CEST (Europe/Zagreb)`) are what these functions produce.
