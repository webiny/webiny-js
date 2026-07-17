import React, { useCallback, useState } from "react";
import { useHotkeys } from "@webiny/app-admin";
import { Command } from "@webiny/admin-ui/Command/index.js";

/**
 * Dedicated hotkey layer for the command palette. `useHotkeys` only fires handlers
 * registered on the current top-most zIndex, so the palette owns its own layer.
 * NOTE (phase 1): components that register a higher zIndex while open will shadow
 * `mod+k`. Layering interplay is revisited in a later phase.
 */
const PALETTE_HOTKEY_ZINDEX = 90;

export const CommandPalette = () => {
    const [open, setOpen] = useState(false);

    const close = useCallback(() => setOpen(false), []);

    useHotkeys({
        zIndex: PALETTE_HOTKEY_ZINDEX,
        keys: {
            "mod+k": e => {
                e.preventDefault();
                setOpen(prev => !prev);
            }
        }
    });

    if (!open) {
        return null;
    }

    return (
        <div
            role="presentation"
            onClick={close}
            className="fixed inset-0 z-overlay flex items-start justify-center bg-neutral-dark/40"
            style={{ padding: "13vh 16px 16px", backdropFilter: "blur(2px)" }}
        >
            <div
                onClick={e => e.stopPropagation()}
                className="flex w-full flex-col overflow-hidden rounded-xl border border-neutral-dimmed bg-neutral-base shadow-xxl"
                style={{ maxWidth: 660 }}
            >
                <Command
                    className="h-auto"
                    onKeyDown={e => {
                        if (e.key === "Escape") {
                            e.preventDefault();
                            close();
                        }
                    }}
                >
                    <div className="border-b border-neutral-subtle p-sm">
                        <Command.Input autoFocus placeholder="Search for pages and actions…" />
                    </div>
                    <Command.List>
                        <Command.Empty>No results found.</Command.Empty>
                        {/* Phase 1: static placeholders to verify theming + keyboard nav.
                            Real Navigation/Actions commands land in later phases. */}
                        <Command.Group heading="Navigation">
                            <Command.Item onSelect={close}>Home</Command.Item>
                            <Command.Item onSelect={close}>Content models</Command.Item>
                            <Command.Item onSelect={close}>Page Builder</Command.Item>
                        </Command.Group>
                    </Command.List>
                </Command>
            </div>
        </div>
    );
};
