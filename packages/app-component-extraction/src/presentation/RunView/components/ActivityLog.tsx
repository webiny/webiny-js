import React, { useEffect, useState } from "react";
import { Button, Loader, Text } from "@webiny/admin-ui";
import type { StageLogItem } from "~/shared/types.js";

/**
 * The stage's activity log, kept and hidden: closed by default, open by default when the stage failed
 * or finished with per-item failures, where the log is what the user needs (waiting-screens-plan.md).
 */
interface Props {
    items: StageLogItem[];
    loading: boolean;
    openByDefault: boolean;
    renderLine: (item: StageLogItem, index: number) => React.ReactNode;
}

export const ActivityLog = ({ items, loading, openByDefault, renderLine }: Props) => {
    const [open, setOpen] = useState(openByDefault);
    // A stage that turns failed or degraded while on screen opens its log then.
    useEffect(() => {
        if (openByDefault) {
            setOpen(true);
        }
    }, [openByDefault]);

    return (
        <div className="flex flex-col gap-xs">
            <div>
                <Button
                    size="sm"
                    variant="ghost"
                    text={open ? "Hide activity log" : "Show activity log"}
                    onClick={() => setOpen(!open)}
                />
            </div>
            {open ? (
                loading && items.length === 0 ? (
                    <div className="py-md">
                        <Loader />
                    </div>
                ) : items.length === 0 ? (
                    <Text size="sm" className="text-neutral-strong">
                        No log entries yet.
                    </Text>
                ) : (
                    <div>{items.map(renderLine)}</div>
                )
            ) : null}
        </div>
    );
};
