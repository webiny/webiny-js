import React from "react";
import { Command, useCommandState } from "cmdk";
import { Text } from "@webiny/admin-ui";
import type { CommandRow } from "../types.js";
import { Keys } from "./Kbd.js";

export const CommandItemRow = ({ row }: { row: CommandRow }) => {
    const selected = useCommandState(state => (state.value || "") === row.value);

    return (
        <Command.Item
            value={row.value}
            onSelect={row.onRun}
            className="flex cursor-pointer items-center gap-sm rounded-lg py-sm pl-sm-plus pr-sm-extra data-[selected=true]:bg-neutral-light"
        >
            {/*
             * The icons come from menus and commands at their own sizes and colours; the slot sets the
             * room and the colour. The colour goes on the svg itself, because an `<Icon>` carries its
             * own fill class and would otherwise win over the slot's.
             */}
            <div className="grid size-md-plus shrink-0 place-items-center [&_svg]:size-md-plus [&_svg]:fill-neutral-strong">
                {row.icon ?? null}
            </div>
            <div className="flex min-w-0 flex-1 flex-col gap-xxs">
                <Text as="div" size="md" className="truncate text-neutral-primary">
                    {row.label}
                </Text>
                {row.sub ? (
                    <Text as="div" size="sm" className="truncate text-neutral-strong">
                        {row.sub}
                    </Text>
                ) : null}
            </div>
            {/*
             * A fixed-height slot, as tall as the icon's: the "Open ↵" pill is taller than a one-line
             * label, and without this a row with no description grew when it was selected.
             */}
            <div className="flex h-md-plus shrink-0 items-center">
                {selected ? (
                    <span className="rounded-sm bg-primary px-sm py-xs text-sm text-neutral-light">
                        {row.verb} ↵
                    </span>
                ) : row.shortcut ? (
                    <Keys keys={row.shortcut} />
                ) : null}
            </div>
        </Command.Item>
    );
};
