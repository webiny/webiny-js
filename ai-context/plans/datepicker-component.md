# DatePicker Component — Implementation Plan

## Context

The `packages/admin-ui/src/DatePicker/` directory contains a prototype (`prototype.tsx`) demonstrating a 10-variant DatePicker using shadcn/ui conventions (`@/components/ui/*`, `@/lib/utils`, lucide-react icons, Badge). These imports don't exist in the Webiny admin-ui package. The task is to build a production-ready DatePicker that follows the existing admin-ui design system: `makeDecoratable`, `withStaticProps`, `cva`/`cn`, `PopoverPrimitive`, `InputPrimitive` styling, `@webiny/icons`, `Tag` (instead of Badge), and the Primitive → FormComponent two-layer pattern (see `ColorPicker` as the reference).

---

## Phase 0: Dependencies

**Modify:** `packages/admin-ui/package.json`

Add:

- `"react-day-picker": "^9.x"` — Calendar rendering engine (not present anywhere in the monorepo)
- `"date-fns": "^4.1.0"` — already in yarn.lock, just not in admin-ui's dependencies

Run `yarn` to install.

---

## Phase 1: Calendar Component (new top-level component)

**Why separate from DatePicker:** Calendar is independently reusable (e.g., inline calendar displays). It follows the same pattern as other admin-ui primitives.

### Create: `packages/admin-ui/src/Calendar/`

| File           | Purpose                                                                                                                                                                                                                                                                                 |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Calendar.tsx` | Wraps `react-day-picker`'s `DayPicker` with admin-ui Tailwind tokens via `classNames` prop. Supports modes: `single`, `multiple`, `range`. Supports `captionLayout="dropdown"`. Uses `chevron_left.svg` / `chevron_right.svg` for nav. Wrapped with `makeDecoratable("Calendar", ...)`. |
| `index.ts`     | `export * from "./Calendar.js";`                                                                                                                                                                                                                                                        |

**Styling approach:** react-day-picker v9 exposes a `classNames` object mapping each internal element (`root`, `day`, `selected`, `range_start`, `nav`, `caption`, etc.) to CSS classes. Map these to admin-ui tokens: `bg-primary` for selected, `hover:bg-neutral-light` for hover, `text-neutral-strong` for body text, `text-neutral-dimmed` for outside-month days, etc.

**Icons:** `{ ReactComponent as ChevronLeft }` from `@webiny/icons/chevron_left.svg`, `{ ReactComponent as ChevronRight }` from `@webiny/icons/chevron_right.svg`.

---

## Phase 2: DatePicker Utilities

### Create: `packages/admin-ui/src/DatePicker/utils/`

| File             | Contents                                                                                                                                                                   |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `dateHelpers.ts` | `defaultYearRange()`, `formatMonthValue(year, month)`, `parseMonthValue(s)`, `getTzOffset(d)`, `toIsoWithTz(d)`, `toLocalNaive(d)` — extracted from prototype lines 57–125 |
| `constants.ts`   | `monthNames` (abbreviated), `fullMonthNames` arrays                                                                                                                        |

---

## Phase 3: Shared Sub-Components

### Create: `packages/admin-ui/src/DatePicker/primitives/components/`

| File                   | Maps to                                                  | Admin-UI primitives used                                                                                                                                                                                                                                                                                       |
| ---------------------- | -------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `TriggerButton.tsx`    | Prototype `TriggerButton` (lines 251–273)                | `Button` with `variant="tertiary"`, `asChild` for PopoverPrimitive.Trigger composition. Uses `inputVariants` from `~/Input/index.js` to match input styling (same pattern as `ColorPickerPrimitive.tsx:93-98`). Icon via `@webiny/icons/calendar_month.svg` or `schedule.svg`. Wrapped with `makeDecoratable`. |
| `YearStepper.tsx`      | Prototype `YearStepper` (lines 808–844)                  | `IconButton` with `variant="ghost"`, `size="sm"`. Icons: `chevron_left.svg`, `chevron_right.svg`.                                                                                                                                                                                                              |
| `TimePicker.tsx`       | Time input in prototype `DateTimePicker` (lines 406–419) | `InputPrimitive` with `type="time"`, `startIcon` using `schedule.svg`.                                                                                                                                                                                                                                         |
| `SelectedTagsList.tsx` | Badge lists in multi-select variants                     | `Tag` from `~/Tag/index.js` with `variant="neutral-light"` and `onDismiss`. Generic: takes `items: Array<{ key: string; label: string }>`, `onRemove`.                                                                                                                                                         |
| `MonthGrid.tsx`        | Month button grid (lines 463–478)                        | `Button` with `variant="primary"` (selected) / `variant="ghost"` (unselected), `size="sm"`.                                                                                                                                                                                                                    |
| `YearGrid.tsx`         | Scrollable year grid (lines 514–530)                     | `ScrollArea` + `Button` grid, same variant pattern as MonthGrid.                                                                                                                                                                                                                                               |
| `index.ts`             | Barrel export of all above                               |

---

## Phase 4: Variant Primitives

### Create: `packages/admin-ui/src/DatePicker/primitives/variants/`

Each variant is its own file, receives typed props, manages local UI state (popover open, viewYear, etc.), and composes the shared sub-components + Calendar + PopoverPrimitive. Each wrapped with `makeDecoratable`.

| File                       | Prototype source | Key composition                                                                                                                                   |
| -------------------------- | ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `DateOnlyPicker.tsx`       | Lines 277–308    | PopoverPrimitive → TriggerButton + Calendar(mode="single")                                                                                        |
| `TimeOnlyPicker.tsx`       | Lines 312–339    | TimePicker (no popover needed)                                                                                                                    |
| `DateTimePicker.tsx`       | Lines 343–425    | PopoverPrimitive → TriggerButton + Calendar(mode="single") + TimePicker. Handles both `datetime-local` and `datetime-tz` via `withTimezone` prop. |
| `MonthPicker.tsx`          | Lines 429–482    | PopoverPrimitive → TriggerButton + YearStepper + MonthGrid                                                                                        |
| `YearPicker.tsx`           | Lines 486–533    | PopoverPrimitive → TriggerButton + YearGrid                                                                                                       |
| `DateRangePicker.tsx`      | Lines 537–575    | PopoverPrimitive → TriggerButton + Calendar(mode="range", numberOfMonths=2)                                                                       |
| `MultipleDatesPicker.tsx`  | Lines 579–637    | PopoverPrimitive → TriggerButton + Calendar(mode="multiple") + SelectedTagsList                                                                   |
| `MultipleMonthsPicker.tsx` | Lines 641–724    | PopoverPrimitive → TriggerButton + YearStepper + MonthGrid + SelectedTagsList                                                                     |
| `MultipleYearsPicker.tsx`  | Lines 728–804    | PopoverPrimitive → TriggerButton + YearGrid + SelectedTagsList                                                                                    |
| `index.ts`                 | Barrel export    |

### Import mapping (prototype → admin-ui)

| Prototype                                  | Admin-UI                                                                          |
| ------------------------------------------ | --------------------------------------------------------------------------------- |
| `cn` from `@/lib/utils`                    | `cn` from `~/utils.js`                                                            |
| `Button variant="outline"`                 | `Button variant="tertiary"`                                                       |
| `Button variant="default"`                 | `Button variant="primary"`                                                        |
| `Calendar` from `@/components/ui/calendar` | `Calendar` from `~/Calendar/index.js`                                             |
| `Popover/PopoverContent/PopoverTrigger`    | `PopoverPrimitive` / `.Content` / `.Trigger` from `~/Popover/index.js`            |
| `Input`                                    | `InputPrimitive` from `~/Input/index.js`                                          |
| `Badge` + X button                         | `Tag` with `onDismiss` from `~/Tag/index.js`                                      |
| `ScrollArea`                               | `ScrollArea` from `~/ScrollArea/index.js`                                         |
| `CalendarIcon` from lucide                 | `{ ReactComponent as CalendarMonthIcon }` from `@webiny/icons/calendar_month.svg` |
| `ClockIcon` from lucide                    | `{ ReactComponent as ScheduleIcon }` from `@webiny/icons/schedule.svg`            |
| `X` from lucide                            | Handled by Tag's built-in dismiss                                                 |

---

## Phase 5: DatePickerPrimitive (Dispatcher)

### Create: `packages/admin-ui/src/DatePicker/primitives/DatePickerPrimitive.tsx`

Switch-case dispatcher (same pattern as prototype lines 128–247). Uses **discriminated union types** for type safety:

```ts
type DatePickerPrimitiveProps =
    | { variant: "date"; value?: Date; onChange?: (value: Date | undefined) => void; ... }
    | { variant: "time"; value?: string; onChange?: (value: string | undefined) => void; ... }
    | { variant: "datetime-local"; value?: Date; onChange?: (value: Date | undefined) => void; ... }
    // ... etc for all 10 variants
```

Shared base props: `placeholder`, `disabled`, `className`, `size`, `inputVariant`, `invalid`, `yearRange`, `weekStartsOn`.

Wrapped with `makeDecoratable("DatePickerPrimitive", ...)`.

### Create: `packages/admin-ui/src/DatePicker/primitives/index.ts`

Exports `DatePickerPrimitive` and all types.

---

## Phase 6: DatePicker (FormComponent Wrapper)

### Create: `packages/admin-ui/src/DatePicker/DatePicker.tsx`

Follows the exact `ColorPicker.tsx` pattern (reference: `packages/admin-ui/src/ColorPicker/ColorPicker.tsx`):

```ts
type DatePickerProps = DatePickerPrimitiveProps & FormComponentProps;
```

Renders: `FormComponentLabel` → `FormComponentDescription` → `DatePickerPrimitive` → `FormComponentErrorMessage` → `FormComponentNote`.

Wrapped with `makeDecoratable("DatePicker", ...)`.

---

## Phase 7: Barrel Exports

### Create: `packages/admin-ui/src/DatePicker/index.ts`

```ts
export * from "./DatePicker.js";
export * from "./primitives/index.js";
```

### Modify: `packages/admin-ui/src/index.ts`

Add (alphabetical order):

```ts
export * from "./Calendar/index.js";
export * from "./DatePicker/index.js";
```

---

## File Tree Summary

```
packages/admin-ui/src/
  Calendar/
    Calendar.tsx                    ← NEW
    index.ts                        ← NEW
  DatePicker/
    prototype.tsx                   ← KEEP (reference, not exported)
    usage.tsx                       ← KEEP (reference, not exported)
    DatePicker.tsx                  ← NEW
    index.ts                        ← NEW
    utils/
      dateHelpers.ts                ← NEW
      constants.ts                  ← NEW
    primitives/
      DatePickerPrimitive.tsx       ← NEW
      index.ts                      ← NEW
      components/
        TriggerButton.tsx           ← NEW
        YearStepper.tsx             ← NEW
        TimePicker.tsx              ← NEW
        SelectedTagsList.tsx        ← NEW
        MonthGrid.tsx               ← NEW
        YearGrid.tsx                ← NEW
        index.ts                    ← NEW
      variants/
        DateOnlyPicker.tsx          ← NEW
        TimeOnlyPicker.tsx          ← NEW
        DateTimePicker.tsx          ← NEW
        MonthPicker.tsx             ← NEW
        YearPicker.tsx              ← NEW
        DateRangePicker.tsx         ← NEW
        MultipleDatesPicker.tsx     ← NEW
        MultipleMonthsPicker.tsx    ← NEW
        MultipleYearsPicker.tsx     ← NEW
        index.ts                    ← NEW
```

**Modified existing files:**

- `packages/admin-ui/package.json` — add dependencies
- `packages/admin-ui/src/index.ts` — add Calendar + DatePicker exports

---

## Verification

1. `yarn build -p @webiny/admin-ui 2>&1 | tail -30` — must compile without errors
2. Create a test page using the `usage.tsx` demo adapted to the new API — verify all 10 variants render and function in the browser
3. `yarn lint` — no lint errors
4. `yarn format` — formatting passes
