import React from "react";
import { Command, useCommandState } from "cmdk";
import { cn } from "@webiny/admin-ui";
import { Icon } from "@webiny/admin-ui";
import { Text } from "@webiny/admin-ui";
import { ReactComponent as ReturnIcon } from "@webiny/icons/keyboard_return.svg";
import type { CommandRow } from "../types.js";
import { Kbd } from "./Kbd.js";

export const CommandItemRow = ({ row }: { row: CommandRow }) => {
    const selected = useCommandState(state => (state.value || "") === row.value);

    let tile = "border-neutral-dimmed bg-neutral-subtle";
    if (selected) {
        tile = "border-primary bg-primary-subtle";
    }

    return (
        <Command.Item
            value={row.value}
            onSelect={row.onRun}
            className="flex cursor-pointer items-center gap-sm rounded-md px-sm py-xs-plus data-[selected=true]:bg-neutral-dimmed"
        >
            <div className={cn("grid size-xl shrink-0 place-items-center rounded-md border", tile)}>
                {row.icon ?? null}
            </div>
            <div className="min-w-0 flex-1">
                <Text as="div" size="md" className="truncate font-medium text-neutral-primary">
                    {row.label}
                </Text>
                {row.sub ? (
                    <Text as="div" size="sm" className="truncate text-neutral-muted">
                        {row.sub}
                    </Text>
                ) : null}
            </div>
            <div className="ml-auto flex shrink-0 items-center gap-xs">
                {row.shortcut?.map((key, index) => (
                    <Kbd key={index}>{key}</Kbd>
                ))}
                {selected ? (
                    <span className="inline-flex items-center gap-xs rounded-sm bg-primary px-xs py-xs text-sm font-medium text-neutral-base">
                        {row.verb}
                        <Icon icon={<ReturnIcon />} color={"neutral-base"} size={"xs"} label={""} />
                    </span>
                ) : null}
            </div>
        </Command.Item>
    );
};
