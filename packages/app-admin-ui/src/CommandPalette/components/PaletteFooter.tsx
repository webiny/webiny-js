import React from "react";
import { Text } from "@webiny/admin-ui";
import { Keys } from "./Kbd.js";

export interface Hint {
    /** One entry per key cap, e.g. `["↑", "↓"]`. */
    keys: React.ReactNode[];
    label: string;
}

export const HintItem = ({ hint }: { hint: Hint }) => (
    <span className="inline-flex shrink-0 items-center gap-xs-plus">
        <Keys keys={hint.keys} />
        <Text size="sm" className="whitespace-nowrap text-neutral-strong">
            {hint.label}
        </Text>
    </span>
);

/**
 * Hints are mode-specific: the shortcuts that matter while searching are not the ones that matter
 * mid-conversation, and a static row would advertise keys that do nothing.
 */
export const HintList = ({ hints }: { hints: Hint[] }) => (
    <div className="flex min-w-0 items-center gap-md">
        {hints.map(hint => (
            <HintItem key={hint.label} hint={hint} />
        ))}
    </div>
);

/** The palette's bottom bar: one thing at each end. Which goes where is the palette's call. */
export const PaletteFooter = ({ start, end }: { start: React.ReactNode; end: React.ReactNode }) => (
    <div className="flex flex-none items-center justify-between gap-md border-t border-neutral-dimmed-darker bg-neutral-light px-lg py-md">
        {start}
        {end}
    </div>
);
