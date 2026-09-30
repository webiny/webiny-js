import React from "react";
import { Text } from "@webiny/admin-ui";
import { useAdminConfig } from "@webiny/app-admin";
import { Kbd } from "./Kbd.js";

export interface Hint {
    keys: React.ReactNode;
    label: string;
}

/**
 * Hints are mode-specific: the shortcuts that matter while searching are not the ones that matter
 * mid-conversation, and a static row would advertise keys that do nothing.
 *
 * The mark is the admin's own square logo rather than a bundled Webiny one, so a white-labelled
 * admin shows its brand here too.
 */
export const PaletteFooter = ({ label, hints }: { label: string; hints: Hint[] }) => {
    const { logo } = useAdminConfig();

    return (
        <div className="flex flex-none items-center justify-between gap-sm border-t border-neutral-subtle bg-neutral-subtle px-md py-sm">
            <div className="flex min-w-0 items-center gap-sm">
                {logo.squareLogo ? (
                    <span
                        aria-hidden
                        className="flex shrink-0 overflow-hidden rounded-sm [&_img]:size-full [&_svg]:size-full"
                        style={{ width: 17, height: 17 }}
                    >
                        {logo.squareLogo}
                    </span>
                ) : null}
                <Text size="sm" className="truncate text-neutral-muted">
                    {label}
                </Text>
            </div>
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
};
