import React from "react";
import { Command } from "cmdk";
import { useCommandState } from "cmdk";
import { Kbd } from "@webiny/admin-ui";
import type { CommandRow } from "../types.js";
import { CommandRowLayout } from "./CommandRowLayout.js";

export const CommandItemRow = ({ row }: { row: CommandRow }) => {
    const selected = useCommandState(state => (state.value || "") === row.value);

    return (
        <Command.Item
            value={row.value}
            onSelect={row.onRun}
            className="group/row cursor-pointer rounded-md transition-colors duration-120 hover:bg-neutral-subtle data-[selected=true]:bg-neutral-light"
        >
            <CommandRowLayout
                icon={row.icon}
                accent={row.accent}
                title={row.label}
                description={row.sub}
                trailing={<CommandRowTrailing row={row} selected={selected} />}
            />
        </Command.Item>
    );
};

/*
 * The selected row says what Enter does, in words and a key cap, rather than in an orange pill: orange
 * is kept for the one primary action. Other rows show their own shortcut, if they have one.
 */
const CommandRowTrailing = ({ row, selected }: { row: CommandRow; selected: boolean }) => {
    if (selected) {
        return (
            <>
                <span className="text-sm text-neutral-strong">{row.verb}</span>
                <Kbd keys={["↵"]} />
            </>
        );
    }
    if (row.shortcut) {
        return <Kbd keys={row.shortcut} />;
    }
    return null;
};
