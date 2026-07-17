import React from "react";
import { CommandPaletteFeature } from "@webiny/app-admin";
import { useFeature } from "@webiny/app";
import { Icon, Text } from "@webiny/admin-ui";
import { ReactComponent as SearchIcon } from "@webiny/icons/search.svg";
import { Kbd } from "./components/index.js";

/**
 * Header affordance that opens the command palette — mirrors the "Search or jump to…"
 * control in the design. The palette is also reachable via the ⌘K / Ctrl+K hotkey.
 */
export const CommandPaletteTrigger = () => {
    const { presenter } = useFeature(CommandPaletteFeature);

    return (
        <button
            type="button"
            onClick={() => presenter.open()}
            className="inline-flex items-center gap-sm rounded-md border border-neutral-dimmed bg-neutral-base px-sm py-xs text-neutral-muted"
            style={{ minWidth: 240 }}
        >
            <Icon icon={<SearchIcon />} color={"neutral-light"} size={"sm"} label={"Search"} />
            <Text size="sm" className="flex-1 text-left text-neutral-muted">
                Search or jump to…
            </Text>
            <Kbd>⌘K</Kbd>
        </button>
    );
};
