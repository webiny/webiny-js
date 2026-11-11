import React from "react";
import { Kbd } from "@webiny/admin-ui";

export interface Hint {
    /** One entry per key cap, e.g. `["↑", "↓"]`. */
    keys: string[];
    label: string;
}

const HintItem = ({ hint }: { hint: Hint }) => (
    <span className="inline-flex shrink-0 items-center gap-xs whitespace-nowrap">
        <Kbd keys={hint.keys} />
        {hint.label}
    </span>
);

/**
 * The palette's bottom bar: what is answering on the left, the keys that work right now on the right.
 *
 * Hints are mode-specific: the shortcuts that matter while searching are not the ones that matter
 * mid-conversation, and a static row would advertise keys that do nothing.
 */
export const PaletteFooter = ({ start, hints }: { start?: string; hints: Hint[] }) => (
    <div className="flex flex-none items-center gap-md border-t-sm border-neutral-dimmed bg-neutral-subtle px-md py-sm-extra text-sm text-neutral-strong">
        {start ? <span className="min-w-0 truncate">{start}</span> : null}
        <span className="flex-1" />
        {hints.map(hint => (
            <HintItem key={hint.label} hint={hint} />
        ))}
    </div>
);
