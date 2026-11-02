### Task 1: admin-ui `DateOnlyPicker` fix

R336, R319 (the earliest pickable day is today, passed as `minDate`), R228 (a behaviour-changing base-package fix is its own `fix(...)` commit); Q63 ("The admin-ui `DateOnlyPicker` is fixed (honour `minDate`, parse `yyyy-MM-dd` as a local date) in its own `fix(admin-ui)` commit"); research-admin G7 and the two `DateOnlyPicker` pitfalls; contract review 1 I1 (the node test replaces a rendered one); Review Focus 2 and 9. Today `DateOnlyPicker` (`packages/admin-ui/src/DatePicker/primitives/DateOnlyPicker.tsx`) does not destructure `minDate` / `maxDate` although `DatePickerBaseProps` declares them (`utils/types.ts:19-20`), and it reads its `yyyy-MM-dd` value with `new Date(value)` (line 41), which is UTC midnight, so west of UTC the calendar highlights the previous day; the trigger text has the same bug through `formatDateForDisplay`'s `date` case (`utils/dateHelpers.ts:23`).

- **`parseDateOnlyValue(value: string): Date`** (new export in `dateHelpers.ts`): a value matching `^\d{4}-\d{2}-\d{2}$` is parsed as local midnight of that day (`const referenceDate = new Date();` then `parse(value, "yyyy-MM-dd", referenceDate)` from `date-fns`, no nested call argument); any other value is `new Date(value)`, exactly as before.
- **`formatDateForDisplay`**: only the `date` case changes: it parses with `parseDateOnlyValue` (its own `const`, then `format(date, displayFormat ?? "PPP")`). Every other case (`dateTimeLocal`, `dateTimeTz`, `month`, `week`, `year`, `dateRange`, `multiple*`) is untouched.
- **`DateOnlyPicker`**: destructures `minDate` and `maxDate`; `selectedDate` is `value ? parseDateOnlyValue(value) : undefined`; the `Calendar` gets `disabled={disabledDays}`, where `disabledDays: Matcher[]` holds `{ before: minDate }` when `minDate` is set and `{ after: maxDate }` when `maxDate` is set — the same matchers `DateTimePicker.tsx:131-134` passes, built with `if` statements instead of inline conditional spreads (see Contract notes). The trigger's `disabled` prop (a boolean) is a different prop and is unchanged. Presets are unchanged (they compare and emit `format(date, "yyyy-MM-dd")` strings).
- **Tests**: admin-ui's vitest runs in node with no testing library (the default environment of `packages/admin-ui/vitest.config.ts`), so there is no rendered test (no `DateOnlyPicker.test.tsx`, no `package.json` change). The new `dateHelpers.test.ts` sets `process.env.TZ` in `beforeAll` and restores it in `afterAll` (vitest 4's default `forks` pool runs each test file in a child process, where a `TZ` assignment takes effect; a first assertion proves it did). The `minDate` wiring is checked by review here and rendered by Task 12 in app-workflows' jsdom.

**Files:**
- Create: `packages/admin-ui/src/DatePicker/utils/dateHelpers.test.ts`
- Modify: `packages/admin-ui/src/DatePicker/utils/dateHelpers.ts`
- Modify: `packages/admin-ui/src/DatePicker/primitives/DateOnlyPicker.tsx`

**Interfaces:**
- Consumes (verified with codegraph and by reading the files at BASE `576c24d1a8`): `formatDateForDisplay` (`packages/admin-ui/src/DatePicker/utils/dateHelpers.ts:4`, re-exported by `utils/index.ts`), `DateOnlyPickerProps` (`utils/types.ts:23`, extends `DatePickerBaseProps` with `minDate?: Date` and `maxDate?: Date` at `:19-20`), `Calendar` (`packages/admin-ui/src/Calendar/Calendar.tsx`, props `DayPickerProps & { className?: string }`), `parse` and `format` from `date-fns` (`^4.4.0`, an admin-ui dependency), type `Matcher` from `react-day-picker` (`10.0.1`, an admin-ui dependency, exported from `dist/esm/types/shared.d.ts:125` through the package index; `Calendar.tsx:2` already imports from this package). The only `type="date"` render path is `DatePickerPrimitive.tsx:17-18`.
- Produces: `parseDateOnlyValue(value: string): Date` (R336; available from `packages/admin-ui/src/DatePicker/utils/dateHelpers.ts` and, through `utils/index.ts`'s `export * from "./dateHelpers.js"`, wherever that barrel is re-exported); `DatePicker type="date"` disables the days before `minDate` and after `maxDate` (Task 12 asserts it rendered).

**Test runner note:** admin package, `yarn test <path>` only. The test is a `.ts` file (no JSX, no React).

- [ ] **Step 1: Write the failing tests**

Create `packages/admin-ui/src/DatePicker/utils/dateHelpers.test.ts`:

```ts
import { afterAll } from "vitest";
import { beforeAll } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { formatDateForDisplay } from "./dateHelpers.js";
import { parseDateOnlyValue } from "./dateHelpers.js";

const originalTimeZone = process.env.TZ;

const useTimeZone = (timeZone: string): void => {
    process.env.TZ = timeZone;
};

const restoreTimeZone = (): void => {
    if (originalTimeZone === undefined) {
        delete process.env.TZ;
        return;
    }
    process.env.TZ = originalTimeZone;
};

describe("date-only values in a zone west of UTC (America/New_York)", () => {
    beforeAll(() => {
        useTimeZone("America/New_York");
    });

    afterAll(() => {
        restoreTimeZone();
    });

    it("runs in the New York zone, where a UTC parse of a yyyy-MM-dd value lands on the previous day", () => {
        const utcMidnight = new Date("2026-10-20");

        expect(utcMidnight.getDate()).toBe(19);
        expect(utcMidnight.getHours()).toBe(20);
    });

    it("parses a yyyy-MM-dd value as local midnight of that day", () => {
        const date = parseDateOnlyValue("2026-10-20");

        expect(date.getFullYear()).toBe(2026);
        expect(date.getMonth()).toBe(9);
        expect(date.getDate()).toBe(20);
        expect(date.getHours()).toBe(0);
        expect(date.getMinutes()).toBe(0);
        expect(date.getSeconds()).toBe(0);
        expect(date.getMilliseconds()).toBe(0);
        expect(date.toISOString()).toBe("2026-10-20T04:00:00.000Z");
    });

    it("parses a full ISO instant as before", () => {
        const value = "2026-10-20T02:00:00.000Z";

        const date = parseDateOnlyValue(value);

        expect(date.getTime()).toBe(Date.parse(value));
        expect(date.getDate()).toBe(19);
    });

    it("parses an ISO value with an offset as before", () => {
        const value = "2026-10-20T23:59:59.999+02:00";

        const date = parseDateOnlyValue(value);

        expect(date.toISOString()).toBe("2026-10-20T21:59:59.999Z");
    });

    it("parses a local date-time value as before", () => {
        const value = "2026-10-20T00:00:00";
        const expected = new Date(value);

        const date = parseDateOnlyValue(value);

        expect(date.getTime()).toBe(expected.getTime());
    });

    it("shows a yyyy-MM-dd value as that day with the default format", () => {
        const label = formatDateForDisplay("2026-10-20", "date");

        expect(label).toBe("October 20th, 2026");
    });

    it("shows a yyyy-MM-dd value as that day with a display format", () => {
        const label = formatDateForDisplay("2026-10-20", "date", "d MMM yyyy");

        expect(label).toBe("20 Oct 2026");
    });

    it("shows a full ISO instant on its local day as before", () => {
        const label = formatDateForDisplay("2026-10-20T02:00:00.000Z", "date");

        expect(label).toBe("October 19th, 2026");
    });

    it("shows nothing for no value", () => {
        const label = formatDateForDisplay(undefined, "date");

        expect(label).toBeUndefined();
    });

    it("leaves the local date-time display unchanged", () => {
        const label = formatDateForDisplay(
            "2026-10-20T02:00:00.000Z",
            "dateTimeLocal",
            "yyyy-MM-dd HH:mm"
        );

        expect(label).toBe("2026-10-19 22:00");
    });
});

describe("date-only values in a zone east of UTC (Asia/Tokyo)", () => {
    beforeAll(() => {
        useTimeZone("Asia/Tokyo");
    });

    afterAll(() => {
        restoreTimeZone();
    });

    it("parses a yyyy-MM-dd value as local midnight of that day", () => {
        const date = parseDateOnlyValue("2026-10-20");

        expect(date.getDate()).toBe(20);
        expect(date.getHours()).toBe(0);
        expect(date.toISOString()).toBe("2026-10-19T15:00:00.000Z");
    });

    it("shows a yyyy-MM-dd value as that day", () => {
        const label = formatDateForDisplay("2026-10-20", "date", "d MMM yyyy");

        expect(label).toBe("20 Oct 2026");
    });
});
```

(The `dateTimeLocal` call wraps because of its length after formatting; its arguments are literals, not nested calls.)

- [ ] **Step 2: Run the tests, expect failure**

```bash
yarn test packages/admin-ui/src/DatePicker/utils/dateHelpers.test.ts 2>&1 | tail -50
```

Expected: FAIL. The five cases that call `parseDateOnlyValue` fail with `TypeError: parseDateOnlyValue is not a function` (it is not exported yet; type errors are not reported by vitest). "shows a yyyy-MM-dd value as that day with the default format" fails with `expected 'October 19th, 2026' to be 'October 20th, 2026'` and the New York "with a display format" case with `expected '19 Oct 2026' to be '20 Oct 2026'` (the UTC parse). These pass already: "runs in the New York zone …" (if it fails, the `TZ` assignment did not reach the test process: stop and report, the remaining assertions would prove nothing), "shows a full ISO instant on its local day as before", "shows nothing for no value", "leaves the local date-time display unchanged", and Tokyo's "shows a yyyy-MM-dd value as that day" (east of UTC the UTC parse lands on the right day). Record the RED output.

- [ ] **Step 3: Implement**

Modify `packages/admin-ui/src/DatePicker/utils/dateHelpers.ts`.

Before (lines 1-3):

```ts
import { format, getISOWeek, getISOWeekYear, startOfISOWeek, endOfISOWeek } from "date-fns";
import { DEFAULT_YEAR_RANGE_SIZE, MONTH_NAMES_SHORT } from "./constants.js";

```

After:

```ts
import { format, getISOWeek, getISOWeekYear, startOfISOWeek, endOfISOWeek } from "date-fns";
import { parse } from "date-fns";
import { DEFAULT_YEAR_RANGE_SIZE, MONTH_NAMES_SHORT } from "./constants.js";

const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/*
 * A "yyyy-MM-dd" value is a calendar day, so it is read as local midnight of that day.
 * "new Date(value)" would read it as UTC midnight, which is the previous day west of UTC.
 * Any other value is parsed with "new Date(value)" as before.
 */
export function parseDateOnlyValue(value: string): Date {
    if (!DATE_ONLY_PATTERN.test(value)) {
        return new Date(value);
    }
    const referenceDate = new Date();
    return parse(value, "yyyy-MM-dd", referenceDate);
}

```

(The existing multi-name `date-fns` import line is left as it is; the new import gets its own line per the one-named-import-per-line rule.)

Before (lines 21-23):

```ts
    switch (type) {
        case "date":
            return format(new Date(value as string), displayFormat ?? "PPP");
```

After:

```ts
    switch (type) {
        case "date": {
            const date = parseDateOnlyValue(value as string);
            return format(date, displayFormat ?? "PPP");
        }
```

Modify `packages/admin-ui/src/DatePicker/primitives/DateOnlyPicker.tsx`.

Before (lines 1-23):

```tsx
import React, { useState } from "react";
import { format } from "date-fns";
import { Button } from "~/Button/index.js";
import { Calendar } from "~/Calendar/index.js";
import { PopoverPrimitive } from "~/Popover/index.js";
import type { DateOnlyPickerProps } from "../utils/types.js";
import { formatDateForDisplay } from "../utils/dateHelpers.js";
import { DatePickerTrigger } from "./components/DatePickerTrigger.js";

const DateOnlyPicker = ({
    value,
    onChange,
    placeholder,
    disabled,
    size,
    variant,
    invalid,
    weekStartsOn,
    onOpenChange,
    className,
    presets,
    displayFormat
}: DateOnlyPickerProps) => {
```

After:

```tsx
import React, { useState } from "react";
import { format } from "date-fns";
import type { Matcher } from "react-day-picker";
import { Button } from "~/Button/index.js";
import { Calendar } from "~/Calendar/index.js";
import { PopoverPrimitive } from "~/Popover/index.js";
import type { DateOnlyPickerProps } from "../utils/types.js";
import { formatDateForDisplay } from "../utils/dateHelpers.js";
import { parseDateOnlyValue } from "../utils/dateHelpers.js";
import { DatePickerTrigger } from "./components/DatePickerTrigger.js";

const DateOnlyPicker = ({
    value,
    onChange,
    placeholder,
    disabled,
    size,
    variant,
    invalid,
    weekStartsOn,
    onOpenChange,
    className,
    presets,
    displayFormat,
    minDate,
    maxDate
}: DateOnlyPickerProps) => {
```

Before (lines 40-41):

```tsx
    const displayValue = formatDateForDisplay(value, "date", displayFormat);
    const selectedDate = value ? new Date(value) : undefined;
```

After:

```tsx
    const displayValue = formatDateForDisplay(value, "date", displayFormat);
    const selectedDate = value ? parseDateOnlyValue(value) : undefined;

    // The days outside minDate and maxDate cannot be picked, as in DateTimePicker.
    const disabledDays: Matcher[] = [];
    if (minDate) {
        disabledDays.push({ before: minDate });
    }
    if (maxDate) {
        disabledDays.push({ after: maxDate });
    }
```

Before (lines 56-66):

```tsx
                        <Calendar
                            mode="single"
                            selected={selectedDate}
                            onSelect={date => {
                                if (onChange) {
                                    onChange(date ? format(date, "yyyy-MM-dd") : undefined);
                                }
                                handleOpenChange(false);
                            }}
                            weekStartsOn={weekStartsOn}
                        />
```

After:

```tsx
                        <Calendar
                            mode="single"
                            selected={selectedDate}
                            onSelect={date => {
                                if (onChange) {
                                    onChange(date ? format(date, "yyyy-MM-dd") : undefined);
                                }
                                handleOpenChange(false);
                            }}
                            weekStartsOn={weekStartsOn}
                            disabled={disabledDays}
                        />
```

Nothing else in the file changes (the presets block, `handlePresetClick` and the trigger stay as they are).

- [ ] **Step 4: Run the new tests, expect pass**

```bash
yarn test packages/admin-ui/src/DatePicker/utils/dateHelpers.test.ts 2>&1 | tail -50
```

Expected: PASS, 12 tests (10 New York, 2 Tokyo).

- [ ] **Step 5: Run the existing tests covering the changed code and type-check**

admin-ui has no other test under `src/DatePicker` or `src/Calendar` (`find packages/admin-ui/src/DatePicker packages/admin-ui/src/Calendar -name "*.test.*"` lists only the new file). admin-ui has no `__tests__/` folder, so `check:test:types` does not list it; its `tsconfig.build.json` includes `src`, so the build type-checks the new test and both changed files:

```bash
find packages/admin-ui/src/DatePicker packages/admin-ui/src/Calendar -name "*.test.*"
yarn test packages/admin-ui/src/DatePicker/utils/dateHelpers.test.ts 2>&1 | tail -20
yarn build -p @webiny/admin-ui --no-cache 2>&1 | tail -30
```

Expected: the `find` lists only `packages/admin-ui/src/DatePicker/utils/dateHelpers.test.ts`; the tests pass; the build prints no TypeScript errors. `@webiny/app-admin`'s `DateTimeInputsRenderer` reaches `DatePickerPrimitive` with unchanged props, so it needs no rebuild for this task (the next build of a consumer picks the change up).

Manual check (review, not a command): `git diff packages/admin-ui` shows exactly the hunks above; `DateTimePicker.tsx` and `utils/types.ts` are not in the diff.

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
yarn build -p @webiny/admin-ui --no-cache 2>&1 | tail -30
git add .
git checkout -- .gitleaks.toml
git status --short
git commit -m "fix(admin-ui): honour minDate and read yyyy-MM-dd as a local day in the date-only picker" -m "DateOnlyPicker now passes minDate and maxDate to the calendar as disabled days, as DateTimePicker does. A yyyy-MM-dd value is parsed as local midnight by the new parseDateOnlyValue helper, used for the selected day and by the date case of formatDateForDisplay, so west of UTC the picker no longer shows the previous day. Other values and the other picker types parse as before." -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>" -m "Claude-Session: https://claude.ai/code/session_01QU3bD1HmkGqCv78zmBsUFW"
```

`git status --short` before the commit lists only the three admin-ui files (plus nothing under `.superpowers`, `docs/.reports` or `.gitleaks.toml`). If any step of the chain changes a file or fails, fix it and rerun the chain from `git add .`. Never push, amend or revert.

## Contract notes

- **Disabled-days matchers:** R336 quotes `disabled={[...(minDate ? [{ before: minDate }] : []), ...(maxDate ? [{ after: maxDate }] : [])]}` (the `DateTimePicker` code). The code-style rule `no-inline-conditional-spreads.md` forbids inline conditional spreads, so the task builds the same list as `const disabledDays: Matcher[] = []` with two `if` statements and passes `disabled={disabledDays}`. The matchers and their order are identical; `DateTimePicker.tsx` is left as it is (not in scope).
- **`Matcher` type:** an annotated array needs an element type, and an inline object type is not allowed; the task imports `type Matcher` from `react-day-picker`, which admin-ui already depends on (`Calendar.tsx` imports `DayPickerProps` from it). No `package.json` change.
- **`formatDateForDisplay("2026-10-20", "date")` "shows 20 Oct 2026"** (Task 1 contract entry): the default format is `PPP`, which renders `October 20th, 2026`; the test asserts that for the default and `20 Oct 2026` with the `d MMM yyyy` display format, so both readings of the contract are pinned.
- **Existing import line:** `dateHelpers.ts:1` imports five names on one line. The task does not split it (a base-package line outside the fix); the new `parse` import is on its own line.
- Size: small (one new test file, two small hunks in two files).

## Review fixes (sub-phase review)

- None needed. Checked: every before-hunk matches `DateOnlyPicker.tsx` and `dateHelpers.ts` at 576c24d1a8; `DateOnlyPickerProps` carries `minDate` / `maxDate` (`utils/types.ts:19-20`); `Matcher` is exported by `react-day-picker` (`types/shared.d.ts:125` through `types/index.d.ts`); the matchers equal `DateTimePicker.tsx:131-134`; the expected instants and labels (New York EDT, Tokyo, `PPP` = `October 20th, 2026`) are correct; admin-ui's `tsconfig.build.json` includes `src`, so the build type-checks the test; commit trailers and the `fix(admin-ui)` subject are present.
