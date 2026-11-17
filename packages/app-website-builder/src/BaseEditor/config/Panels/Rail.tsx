import React from "react";
import { cn } from "@webiny/admin-ui";

export interface RailItem {
    name: string;
    label: string;
    icon?: React.JSX.Element;
    open: boolean;
}

export interface RailProps {
    panels: RailItem[];
    onToggle(name: string): void;
}

/**
 * The strip at the editor's right edge: one tab per panel, an icon over a label written down the
 * strip. A tab opens its panel and closes it again.
 */
export const Rail = ({ panels, onToggle }: RailProps) => {
    if (panels.length === 0) {
        return null;
    }

    return (
        <nav
            aria-label={"Editor panels"}
            data-role={"editor-rail"}
            data-affects-preview={"width"}
            className={
                "flex w-[40px] flex-none flex-col items-center gap-xs border-l-sm border-l-neutral-dimmed bg-neutral-base py-sm"
            }
        >
            {panels.map(panel => (
                <button
                    key={panel.name}
                    type={"button"}
                    aria-pressed={panel.open}
                    title={panel.open ? `Close ${panel.label}` : `Open ${panel.label}`}
                    onClick={() => onToggle(panel.name)}
                    className={cn(
                        "flex w-[32px] flex-col items-center gap-xs rounded-md py-sm text-sm text-neutral-strong",
                        "hover:bg-neutral-dimmed focus-visible:outline-none focus-visible:ring-sm focus-visible:ring-primary-default",
                        panel.open && "bg-neutral-dimmed text-neutral-primary"
                    )}
                >
                    {panel.icon ? (
                        <span
                            className={"flex size-[16px] items-center justify-center fill-current"}
                        >
                            {panel.icon}
                        </span>
                    ) : null}
                    <span className={"[writing-mode:vertical-rl]"}>{panel.label}</span>
                </button>
            ))}
        </nav>
    );
};
