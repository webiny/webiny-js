import type { ClassNames } from "react-day-picker";

export const calendarClassNames: Partial<ClassNames> = {
    root: "p-md",
    months: "relative flex gap-md",
    month: "flex flex-col gap-sm",
    month_caption: "flex items-center justify-center h-8 relative",
    caption_label: "text-md font-semibold text-neutral-strong",
    nav: "absolute inset-x-0 flex items-center justify-between",
    button_previous:
        "inline-flex items-center justify-center size-8 rounded-sm cursor-pointer text-neutral-strong hover:bg-neutral-light",
    button_next:
        "inline-flex items-center justify-center size-8 rounded-sm cursor-pointer text-neutral-strong hover:bg-neutral-light",
    month_grid: "border-collapse",
    weekdays: "",
    weekday: "text-xs font-medium text-neutral-dimmed size-9 text-center",
    weeks: "",
    week: "",
    day: "size-9 text-center text-sm p-0 relative",
    day_button:
        "inline-flex items-center justify-center size-9 rounded-sm font-normal cursor-pointer hover:bg-neutral-light transition-colors",
    selected:
        "[&>button]:bg-primary [&>button]:text-neutral-base [&>button]:hover:bg-primary-strong [&>button]:font-medium",
    today: "[&>button]:border-sm [&>button]:border-primary",
    outside: "[&>button]:text-neutral-dimmed [&>button]:opacity-50",
    disabled: "[&>button]:text-neutral-disabled [&>button]:cursor-not-allowed",
    hidden: "invisible",
    range_start:
        "[&>button]:bg-primary [&>button]:text-neutral-base [&>button]:hover:bg-primary-strong [&>button]:rounded-r-none",
    range_end:
        "[&>button]:bg-primary [&>button]:text-neutral-base [&>button]:hover:bg-primary-strong [&>button]:rounded-l-none",
    range_middle:
        "bg-primary-subtle [&>button]:bg-transparent [&>button]:text-primary-strong [&>button]:rounded-none [&>button]:hover:bg-primary-subtle/70",
    focused: "[&>button]:ring-2 [&>button]:ring-primary-dimmed",
    dropdowns: "flex items-center gap-sm",
    dropdown:
        "appearance-none border-sm border-neutral-muted rounded-sm px-sm py-xs text-sm cursor-pointer bg-neutral-base",
    dropdown_root: "relative",
    chevron: "size-md fill-current",
    footer: "pt-sm text-sm text-neutral-dimmed"
};
