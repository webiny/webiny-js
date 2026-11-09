import React from "react";
import { IconButton } from "@webiny/admin-ui";
import { Kbd } from "@webiny/admin-ui";
import { Text } from "@webiny/admin-ui";
import type { ActiveCommandVm } from "@webiny/app-admin";
import { ReactComponent as BackIcon } from "@webiny/icons/arrow_back.svg";

interface CommandDetailProps {
    active: ActiveCommandVm;
    onBack: () => void;
    onClose: () => void;
}

/**
 * Renders a command's detail view (e.g. a form) inside the palette. Back returns to the
 * command list; the detail view itself calls onClose when it completes.
 */
export const CommandDetail = ({ active, onBack, onClose }: CommandDetailProps) => {
    const { command, DetailView } = active;

    return (
        <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
            <div className="flex items-center gap-sm h-[56px] border-b-sm border-neutral-dimmed px-sm">
                <IconButton
                    variant={"ghost"}
                    size={"sm"}
                    icon={<BackIcon />}
                    onClick={onBack}
                    aria-label="Back"
                />
                {command.icon}
                <Text size="md" className="flex-1 font-medium text-neutral-primary">
                    {command.label}
                </Text>
                <Kbd keys={["esc"]} />
            </div>
            <div style={{ flex: 1, minHeight: 0, overflowY: "auto" }}>
                <DetailView command={command} onClose={onClose} onBack={onBack} />
            </div>
        </div>
    );
};
