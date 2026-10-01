import React from "react";
import { Command as CommandPrimitive } from "cmdk";
import { useCommandState } from "cmdk";
import { Text } from "@webiny/admin-ui";
import { ReactComponent as CloseIcon } from "@webiny/icons/close.svg";
import { EnterPill } from "./EnterPill.js";
import { ROW_CLASS_NAME } from "./rowClassName.js";
import { Tile } from "./Tile.js";

const EXIT_VALUE = "exit-preview";

interface ExitRowProps {
    name: string;
    onExit: () => void;
}

export const ExitRow = ({ name, onExit }: ExitRowProps) => {
    const selected = useCommandState(state => state.value === EXIT_VALUE);

    return (
        <CommandPrimitive.Item
            value={EXIT_VALUE}
            keywords={["exit", "stop", "leave", name]}
            onSelect={onExit}
            className={ROW_CLASS_NAME}
        >
            <Tile selected={selected} icon={<CloseIcon />} />
            <div className="min-w-0 flex-1">
                <Text as="div" size="md" className="truncate font-medium text-neutral-primary">
                    {`Exit preview of ${name}`}
                </Text>
                <Text as="div" size="sm" className="truncate text-neutral-muted">
                    {"Back to your own permissions"}
                </Text>
            </div>
            {selected && <EnterPill verb={"Exit"} />}
        </CommandPrimitive.Item>
    );
};
