import React, { useState } from "react";
import { Text } from "@webiny/admin-ui";

interface ObjectRowProps {
    title: React.ReactNode;
    onOpen: () => void;
    actions?: React.ReactNode;
}

/**
 * A clickable row representing an object (a single object field, or one item of a list). Resting,
 * it shows the title. On hover it tints and reveals its trailing actions (reorder / remove) - rows
 * without actions (a single object field) just tint.
 */
export const ObjectRow = ({ title, onOpen, actions }: ObjectRowProps) => {
    const [hovered, setHovered] = useState(false);
    const showActions = hovered && Boolean(actions);

    return (
        <div
            role={"button"}
            tabIndex={0}
            onClick={onOpen}
            onKeyDown={event => {
                if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    onOpen();
                }
            }}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            // Fixed height + vertical centering keeps the row the same height whether or not the
            // (taller) hover actions are shown.
            style={{ height: 40 }}
            className={[
                "flex items-center justify-between gap-xs rounded-md border border-neutral-dimmed-darker px-sm-extra cursor-pointer transition-colors",
                hovered ? "bg-neutral-light" : "bg-neutral-base"
            ].join(" ")}
        >
            <div className={"flex flex-1 items-center min-w-0"}>
                <Text size={"sm"} className={"truncate text-neutral-strong"}>
                    {title}
                </Text>
            </div>
            {showActions ? (
                <div
                    className={"flex items-center gap-xs shrink-0"}
                    onClick={event => event.stopPropagation()}
                >
                    {actions}
                </div>
            ) : null}
        </div>
    );
};
