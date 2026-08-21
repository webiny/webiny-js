import React from "react";
import { Text } from "@webiny/admin-ui";
import { Kbd } from "./Kbd.js";

export interface Hint {
    keys: React.ReactNode;
    label: string;
}

/**
 * Hints are mode-specific: the shortcuts that matter while searching are not the ones that matter
 * mid-conversation, and a static row would advertise keys that do nothing.
 */
export const PaletteFooter = ({ label, hints }: { label: string; hints: Hint[] }) => (
    <div className="flex flex-none items-center justify-between gap-sm border-t border-neutral-subtle bg-neutral-subtle px-sm py-xs-plus">
        <Text size="sm" className="truncate text-neutral-muted">
            {label}
        </Text>
        <div className="flex shrink-0 items-center gap-md">
            {hints.map(hint => (
                <Text
                    key={hint.label}
                    size="sm"
                    className="inline-flex items-center gap-xs text-neutral-muted"
                >
                    <Kbd>{hint.keys}</Kbd>
                    {hint.label}
                </Text>
            ))}
        </div>
    </div>
);
