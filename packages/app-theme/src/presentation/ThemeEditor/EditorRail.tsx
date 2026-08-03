import React from "react";
import { Tag, Text } from "@webiny/admin-ui";
import { ReactComponent as CheckCircleIcon } from "@webiny/icons/check_circle.svg";
import { EDITOR_GROUPS, type EditorGroupId } from "~/constants.js";
import type { ThemeDto } from "~/features/themeGateway/index.js";

interface EditorRailProps {
    theme: ThemeDto;
    isActive: boolean;
    group: EditorGroupId;
    onGroupChange: (group: EditorGroupId) => void;
}

/**
 * The left rail: what you are editing, and which part of it.
 *
 * Group order matters — colours first because it is what most people came for, policy last because
 * it is set once and then left alone.
 */
export const EditorRail = ({ theme, isActive, group, onGroupChange }: EditorRailProps) => {
    return (
        <div className="w-[208px] flex-none border-r border-neutral-dimmed flex flex-col bg-neutral-base">
            <div className="p-md border-b border-neutral-dimmed">
                <Text size="md" className="block font-semibold">
                    {theme.properties.name}
                </Text>
                <div className="flex items-center gap-xs mt-sm">
                    {isActive ? (
                        <Tag variant="accent" icon={<CheckCircleIcon />} content="Active" />
                    ) : (
                        <Tag
                            variant="neutral-light"
                            content={theme.status === "draft" ? "Draft" : "Published"}
                        />
                    )}
                    <Text
                        size="sm"
                        className="font-mono text-neutral-strong"
                    >{`v${theme.version}`}</Text>
                </div>
            </div>

            <nav className="p-xs flex flex-col gap-[1px]">
                {EDITOR_GROUPS.map(item => (
                    <button
                        key={item.id}
                        type="button"
                        onClick={() => onGroupChange(item.id)}
                        className={`flex items-center gap-sm rounded-sm px-sm py-xs text-left text-md ${
                            group === item.id
                                ? "bg-accent-subtle text-accent-primary font-medium"
                                : "text-neutral-primary hover:bg-neutral-light"
                        }`}
                    >
                        {item.label}
                    </button>
                ))}
            </nav>
        </div>
    );
};
