import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Popover as RadixPopover } from "radix-ui";
import { ReactComponent as CalendarMonthIcon } from "@webiny/icons/calendar_month.svg";
import { ReactComponent as CloseIcon } from "@webiny/icons/close.svg";
import { Icon } from "~/Icon/index.js";
import { inputVariants } from "~/Input/index.js";
import { ScrollArea } from "~/ScrollArea/index.js";
import { useEscapeScrollLock } from "~/hooks/index.js";
import { cn, cva } from "~/utils.js";
import type { BirthdayPickerProps } from "../utils/types.js";
import { BirthdayPickerCell } from "./BirthdayPickerCell.js";
import { BirthdayPickerSegments } from "./BirthdayPickerSegments.js";
import { MONTH_NAMES_FULL } from "../utils/constants.js";
import {
    type BirthdayParts,
    type BirthdayStep,
    type BirthdayRange,
    birthdayYears,
    formatBirthdayValue,
    isDayDisabled,
    isMonthDisabled,
    isYearDisabled,
    nextBirthdayStep,
    pad,
    parseBirthdayValue,
    pickDay,
    pickMonth,
    pickYear
} from "../utils/birthdayHelpers.js";

type Step = BirthdayStep;

const STEPS: Step[] = ["day", "month", "year"];

const STEP_LABELS: Record<Step, string> = {
    day: "Select a day",
    month: "Select a month",
    year: "Select a year"
};

const DAYS = Array.from({ length: 31 }, (_, index) => index + 1);
const MONTHS = Array.from({ length: 12 }, (_, index) => index + 1);

/** Timings, in ms. */
const EXPAND_MS = 250;
const SLIDE_MS = 300;
const FADE_OUT_MS = 120;
const COLLAPSE_MS = 200;

/**
 * - `collapsed`: the card is mounted at the bar's height, about to grow (or done shrinking).
 * - `expanded`: the card is at full height with the step grid showing.
 * - `collapsing`: the body fades and the card shrinks back into the bar.
 */
type Phase = "collapsed" | "expanded" | "collapsing";

/**
 * The card is the bar, grown: it keeps the focused input's border, its corner radius and, in the
 * header, its horizontal padding, so the date doesn't move when the card opens.
 */
const cardVariants = cva(
    [
        "bg-neutral-base border-sm border-neutral-black shadow-lg overflow-hidden",
        "text-md text-neutral-strong fill-neutral-xstrong",
        "w-(--radix-popover-trigger-width) min-w-[320px]"
    ],
    {
        variants: {
            size: {
                md: "rounded-md",
                lg: "rounded-md",
                xl: "rounded-lg leading-6"
            }
        },
        defaultVariants: {
            size: "lg"
        }
    }
);

const cardHeaderVariants = cva("flex items-center justify-between gap-sm", {
    variants: {
        size: {
            md: "px-[calc(var(--padding-sm-extra)-(var(--border-width-sm)))]",
            lg: "px-[calc(var(--padding-sm-extra)-(var(--border-width-sm)))]",
            xl: "px-[calc(var(--padding-md)-(var(--border-width-sm)))]"
        }
    },
    defaultVariants: {
        size: "lg"
    }
});

/**
 * Every step shares one grid height, the day grid's six rows plus the inset that keeps a cell's
 * focus ring inside the clipped area, so the card keeps its height as the steps slide. Only the
 * year grid scrolls inside it.
 */
const gridHeight = "h-[calc(6*var(--spacing-xl)+5*var(--spacing-sm)+2*var(--spacing-xs))]";
const dayGridWidth = "max-w-[calc(6*var(--spacing-xxl)+5*var(--spacing-xs))]";
const wideGridWidth = "max-w-[calc(5*var(--spacing-3xl)+4*var(--spacing-sm))]";

/**
 * Picks a date one part at a time: a day, then a month, then a year. Each pick moves to the
 * next step. A pick that completes the date commits it, and the last step closes the picker.
 * Meant for dates far in the past, like a date of birth, where paging a calendar month by
 * month is slow.
 *
 * The value is a `YYYY-MM-DD` string, the same as the `date` picker's. Days, months and years
 * that can't make a date between `minDate` and `maxDate` can't be picked.
 */
const BirthdayPicker = ({
    value,
    onChange,
    disabled,
    size,
    variant,
    invalid,
    yearRange,
    minDate,
    maxDate,
    onOpenChange,
    className
}: BirthdayPickerProps) => {
    const [open, setOpen] = useState(false);
    const [phase, setPhase] = useState<Phase>("collapsed");
    const [step, setStep] = useState<Step>("day");
    const [draft, setDraft] = useState<BirthdayParts>({});
    const [barHeight, setBarHeight] = useState(0);
    const [bodyHeight, setBodyHeight] = useState(0);

    const barRef = useRef<HTMLDivElement>(null);
    const cardRef = useRef<HTMLDivElement | null>(null);
    /** The divider and the step body: what the card adds to the bar's height when it grows. */
    const bodyRef = useRef<HTMLDivElement | null>(null);
    const panelRefs = useRef<Record<Step, HTMLDivElement | null>>({
        day: null,
        month: null,
        year: null
    });
    /** The steps picked since the card opened. */
    const picked = useRef<Set<Step>>(new Set());
    const closeTimer = useRef<ReturnType<typeof setTimeout>>();
    const escapeScrollLock = useEscapeScrollLock<HTMLDivElement>();

    const saved = useMemo(() => parseBirthdayValue(value), [value]);
    const years = useMemo(
        () => birthdayYears(yearRange, saved.year, { minDate, maxDate }),
        [yearRange, saved.year, minDate, maxDate]
    );
    const range = useMemo<BirthdayRange>(
        () => ({ years, minDate, maxDate }),
        [years, minDate, maxDate]
    );

    useEffect(() => () => clearTimeout(closeTimer.current), []);

    const expand = () => {
        if (disabled || open) {
            return;
        }
        clearTimeout(closeTimer.current);
        setBarHeight(barRef.current?.offsetHeight ?? 0);
        setDraft(saved);
        picked.current = new Set();
        setStep("day");
        setPhase("collapsed");
        setOpen(true);
        onOpenChange?.(true);
    };

    const collapse = () => {
        if (phase === "collapsing") {
            return;
        }
        setPhase("collapsing");
        closeTimer.current = setTimeout(() => {
            setOpen(false);
            setPhase("collapsed");
            onOpenChange?.(false);
        }, FADE_OUT_MS + COLLAPSE_MS);
    };

    /**
     * The card mounts at the bar's height. Wait for the popper to place it before growing,
     * or the first part of the growth happens off screen. The body is laid out by its own
     * spacing, so its height is measured here, once it exists, and the card grows by that much.
     */
    useLayoutEffect(() => {
        if (!open || phase !== "collapsed") {
            return;
        }
        let second = 0;
        const first = requestAnimationFrame(() => {
            second = requestAnimationFrame(() => {
                setBodyHeight(bodyRef.current?.offsetHeight ?? 0);
                setPhase("expanded");
            });
        });
        return () => {
            cancelAnimationFrame(first);
            cancelAnimationFrame(second);
        };
    }, [open, phase]);

    /** A card that grows past the bottom of the viewport brings the field into view. */
    useEffect(() => {
        if (phase !== "expanded") {
            return;
        }
        const timer = setTimeout(() => {
            const rect = cardRef.current?.getBoundingClientRect();
            if (rect && rect.bottom > window.innerHeight) {
                barRef.current?.scrollIntoView({ block: "center", behavior: "smooth" });
            }
        }, EXPAND_MS);
        return () => clearTimeout(timer);
    }, [phase]);

    /**
     * Entering a step focuses its selected cell (or its first one) so the keyboard picks up
     * where the pointer would. The year grid also scrolls the selected year into view, or
     * back to the newest year when none is selected.
     *
     * The popover portal mounts its content a render after `open` flips, so this waits for
     * the card to expand, by which point the panels exist.
     */
    useEffect(() => {
        if (!open || phase !== "expanded") {
            return;
        }
        const panel = panelRefs.current[step];
        if (!panel) {
            return;
        }
        const selected = panel.querySelector<HTMLButtonElement>("[data-selected=true]");
        const viewport = panel.querySelector<HTMLDivElement>("[data-slot=scroll-area-viewport]");
        if (viewport) {
            if (selected) {
                const offset =
                    selected.getBoundingClientRect().top - viewport.getBoundingClientRect().top;
                viewport.scrollTop +=
                    offset - viewport.clientHeight / 2 + selected.offsetHeight / 2;
            } else {
                viewport.scrollTop = 0;
            }
        }
        const target = selected ?? panel.querySelector<HTMLButtonElement>("button:enabled");
        target?.focus({ preventScroll: true });
    }, [open, phase, step]);

    const goToStep = (next: Step) => {
        setStep(next);
    };

    /**
     * Any pick that completes the date commits it, so closing the card early never drops a
     * date the header shows as filled. The header segments let parts be picked out of order.
     */
    const onPick = (pickedStep: Step, next: BirthdayParts) => {
        setDraft(next);
        picked.current.add(pickedStep);
        const nextValue = formatBirthdayValue(next);
        if (nextValue) {
            onChange?.(nextValue);
        }
        const nextStep = nextBirthdayStep(next, pickedStep, picked.current);
        if (nextStep) {
            goToStep(nextStep);
            return;
        }
        collapse();
    };

    const onPickDay = (day: number) => onPick("day", pickDay(draft, day, range));

    const onPickMonth = (month: number) => onPick("month", pickMonth(draft, month, range));

    const onPickYear = (year: number) => onPick("year", pickYear(draft, year));

    const onBarKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
        if (event.target !== event.currentTarget) {
            return;
        }
        if (event.key === "Enter" || event.key === " " || event.key === "ArrowDown") {
            event.preventDefault();
            expand();
        }
    };

    const expanded = phase === "expanded";
    const cardHeight = expanded ? barHeight + bodyHeight : barHeight;
    const stepIndex = STEPS.indexOf(step);

    const icons = (interactive: boolean) => (
        <span className="flex items-center gap-xs shrink-0">
            {interactive && value && !disabled ? (
                <button
                    type="button"
                    aria-label="Clear date"
                    className="flex cursor-pointer rounded-xs outline-none focus-visible:ring-sm focus-visible:ring-primary-dimmed"
                    onClick={event => {
                        event.stopPropagation();
                        onChange?.(undefined);
                    }}
                    onKeyDown={event => event.stopPropagation()}
                >
                    <Icon icon={<CloseIcon />} label="Clear" size="sm" color="inherit" />
                </button>
            ) : null}
            <Icon icon={<CalendarMonthIcon />} label="Calendar" size="sm" color="inherit" />
        </span>
    );

    const panelProps = (panelStep: Step) => ({
        ref: (element: HTMLDivElement | null) => {
            panelRefs.current[panelStep] = element;
        },
        "aria-hidden": step !== panelStep,
        "data-step": panelStep
    });

    return (
        <div className={className}>
            <RadixPopover.Root
                open={open}
                onOpenChange={isOpen => (isOpen ? expand() : collapse())}
            >
                <RadixPopover.Anchor asChild>
                    <div
                        ref={barRef}
                        role="button"
                        tabIndex={disabled ? -1 : 0}
                        aria-haspopup="dialog"
                        aria-expanded={open}
                        data-disabled={disabled}
                        data-focused={open}
                        onClick={expand}
                        onKeyDown={onBarKeyDown}
                        className={cn(
                            inputVariants({ size, variant, invalid }),
                            "cursor-pointer justify-between select-none min-w-0 overflow-hidden outline-none",
                            disabled && "pointer-events-none"
                        )}
                    >
                        <BirthdayPickerSegments parts={saved} />
                        {icons(true)}
                    </div>
                </RadixPopover.Anchor>
                <RadixPopover.Portal>
                    <RadixPopover.Content
                        ref={escapeScrollLock}
                        side="bottom"
                        align="start"
                        sideOffset={-barHeight}
                        avoidCollisions={false}
                        onOpenAutoFocus={event => event.preventDefault()}
                        onCloseAutoFocus={event => {
                            event.preventDefault();
                            barRef.current?.focus({ preventScroll: true });
                        }}
                        className="z-popover outline-none"
                    >
                        <div
                            ref={cardRef}
                            role="dialog"
                            aria-label={STEP_LABELS[step]}
                            data-phase={phase}
                            className={cn(
                                cardVariants({ size }),
                                phase === "collapsing" && "pointer-events-none"
                            )}
                            style={{
                                height: cardHeight,
                                transition:
                                    phase === "collapsing"
                                        ? `height ${COLLAPSE_MS}ms ease-in ${FADE_OUT_MS}ms`
                                        : `height ${EXPAND_MS}ms ease-out`
                            }}
                        >
                            <div
                                className={cardHeaderVariants({ size })}
                                style={{
                                    height: `calc(${barHeight}px - 2 * var(--border-width-sm))`
                                }}
                            >
                                <BirthdayPickerSegments
                                    parts={draft}
                                    activeStep={step}
                                    onStepClick={goToStep}
                                />
                                {icons(false)}
                            </div>
                            <div ref={bodyRef}>
                                <div
                                    className="h-px bg-neutral-dimmed origin-center"
                                    style={{
                                        transform: expanded ? "scaleX(1)" : "scaleX(0)",
                                        transition: `transform ${EXPAND_MS}ms ease-out`
                                    }}
                                />
                                <div
                                    className="pb-md"
                                    style={{
                                        opacity: expanded ? 1 : 0,
                                        transition: expanded
                                            ? `opacity 200ms ease-out ${EXPAND_MS - 100}ms`
                                            : `opacity ${FADE_OUT_MS}ms ease-in`
                                    }}
                                >
                                    <div
                                        className="pt-sm-extra pb-xs text-center text-sm text-neutral-muted"
                                        aria-live="polite"
                                    >
                                        {STEP_LABELS[step]}
                                    </div>
                                    <div className={cn("overflow-hidden", gridHeight)}>
                                        <div
                                            className="flex h-full w-[300%]"
                                            style={{
                                                transform: `translateX(-${(stepIndex * 100) / 3}%)`,
                                                transition: `transform ${SLIDE_MS}ms ease-in-out`
                                            }}
                                        >
                                            <div
                                                {...panelProps("day")}
                                                className="w-1/3 h-full px-md py-xs"
                                            >
                                                <div
                                                    className={cn(
                                                        "grid grid-cols-6 gap-x-xs gap-y-sm mx-auto",
                                                        dayGridWidth
                                                    )}
                                                >
                                                    {DAYS.map(day => (
                                                        <BirthdayPickerCell
                                                            key={day}
                                                            selected={draft.day === day}
                                                            disabled={isDayDisabled(day, range)}
                                                            tabbable={step === "day"}
                                                            onClick={() => onPickDay(day)}
                                                        >
                                                            {pad(day)}
                                                        </BirthdayPickerCell>
                                                    ))}
                                                </div>
                                            </div>
                                            <div
                                                {...panelProps("month")}
                                                className="w-1/3 h-full px-md py-xs flex items-center"
                                            >
                                                <div
                                                    className={cn(
                                                        "grid grid-cols-3 gap-x-sm gap-y-md w-full mx-auto",
                                                        wideGridWidth
                                                    )}
                                                >
                                                    {MONTHS.map(month => (
                                                        <BirthdayPickerCell
                                                            key={month}
                                                            selected={draft.month === month}
                                                            disabled={isMonthDisabled(
                                                                month,
                                                                draft,
                                                                range
                                                            )}
                                                            tabbable={step === "month"}
                                                            onClick={() => onPickMonth(month)}
                                                        >
                                                            {MONTH_NAMES_FULL[month - 1]}
                                                        </BirthdayPickerCell>
                                                    ))}
                                                </div>
                                            </div>
                                            <div {...panelProps("year")} className="w-1/3 h-full">
                                                <ScrollArea className="h-full">
                                                    <div className="px-md py-xs">
                                                        <div
                                                            className={cn(
                                                                "grid grid-cols-5 gap-sm w-full mx-auto",
                                                                wideGridWidth
                                                            )}
                                                        >
                                                            {years.map(year => (
                                                                <BirthdayPickerCell
                                                                    key={year}
                                                                    selected={draft.year === year}
                                                                    disabled={isYearDisabled(
                                                                        year,
                                                                        draft,
                                                                        range
                                                                    )}
                                                                    tabbable={step === "year"}
                                                                    onClick={() => onPickYear(year)}
                                                                >
                                                                    {year}
                                                                </BirthdayPickerCell>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </ScrollArea>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </RadixPopover.Content>
                </RadixPopover.Portal>
            </RadixPopover.Root>
        </div>
    );
};

export { BirthdayPicker };
