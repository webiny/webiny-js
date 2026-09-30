import React from "react";
import { Command } from "cmdk";
import { ReactComponent as SearchIcon } from "@webiny/icons/search.svg";
import { ReactComponent as ReturnIcon } from "@webiny/icons/keyboard_return.svg";
import { ReactComponent as ArrowUpIcon } from "@webiny/icons/keyboard_arrow_up.svg";
import { ReactComponent as ArrowDownIcon } from "@webiny/icons/keyboard_arrow_down.svg";
import type { CommandGroup } from "../types.js";
import {
    CommandItemRow,
    GroupHeading,
    HintIcon,
    NoResults,
    type Hint
} from "../components/index.js";
import type { PaletteMode, PaletteModeKeyContext } from "./PaletteMode.js";

const HINTS: Hint[] = [
    {
        keys: (
            <>
                <HintIcon element={<ArrowUpIcon />} />
                <HintIcon element={<ArrowDownIcon />} />
            </>
        ),
        label: "Navigate"
    },
    { keys: <HintIcon element={<ReturnIcon />} />, label: "Select" }
];

const AI_HINT: Hint = { keys: "space", label: "Ask AI" };

export interface CommandModeParams {
    groups: CommandGroup[];
    query: string;
    /**
     * Switch to the assistant, optionally carrying the query. Absent when the assistant is not
     * licensed, and then nothing in this mode offers it.
     */
    askAi?: (seed?: string) => void;
}

/**
 * The command list, as a palette mode: what the palette shows when no other mode is active.
 *
 * Unlike `createAiMode`, this is rebuilt on every render from values the palette already holds. Its
 * state is the query and the rows, and both belong to the palette, so there is nothing to keep.
 */
export const createCommandMode = ({ groups, query, askAi }: CommandModeParams): PaletteMode => ({
    appearance: {
        icon: <SearchIcon />,
        iconColor: "neutral-light",
        iconLabel: "Search",
        placeholder: "Search for pages and actions…",
        footerLabel: "Webiny command palette",
        hints: askAi ? [...HINTS, AI_HINT] : HINTS,
        tall: false,
        filterable: true
    },

    body: (
        <Command.List>
            <Command.Empty>
                {/* A search that found nothing becomes the question as-is. */}
                <NoResults query={query} onAskAi={askAi ? () => askAi(query) : undefined} />
            </Command.Empty>

            {groups.map(group => (
                <Command.Group key={group.title} heading={<GroupHeading title={group.title} />}>
                    {group.rows.map(row => (
                        <CommandItemRow key={row.key} row={row} />
                    ))}
                </Command.Group>
            ))}
        </Command.List>
    ),

    // The command list is where the palette starts, so there is nothing to enter or drop.
    enter() {},
    reset() {},

    handleKey(event: React.KeyboardEvent, context: PaletteModeKeyContext) {
        // Space on an EMPTY query asks AI. Gated on the empty query so space stays an ordinary
        // character the moment there is anything to search, and "new entry" keeps working.
        if (askAi && event.key === " " && context.query === "") {
            event.preventDefault();
            askAi();
            return true;
        }

        return false;
    }
});
