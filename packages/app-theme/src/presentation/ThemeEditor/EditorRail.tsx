import React, { useEffect, useState } from "react";
import { cn, Input, Tag, Text } from "@webiny/admin-ui";
import { ReactComponent as CheckCircleIcon } from "@webiny/icons/check_circle.svg";
import { ReactComponent as EditIcon } from "@webiny/icons/edit.svg";
import { EDITOR_GROUPS, type EditorGroupId } from "~/constants.js";
import type { ThemeDto } from "~/features/themeGateway/index.js";
import { GROUP_ICONS } from "./groupMeta.js";

interface EditorRailProps {
    theme: ThemeDto;
    /** Whether the *viewed* revision is the live one — not merely that some version of it is. */
    isActive: boolean;
    /** The live version number of this theme, if any. Null when no version is active. */
    activeVersion: number | null;
    /** Jumps to the live version. Absent when this theme has no active version. */
    onOpenActiveVersion?: () => void;
    group: EditorGroupId;
    onGroupChange: (group: EditorGroupId) => void;
    /** Groups with an advisory warning worth surfacing in the rail, e.g. a contrast failure. */
    warnings: ReadonlySet<EditorGroupId>;
    /** Renaming is disabled on locked (published) revisions. */
    readOnly: boolean;
    onRename: (name: string) => void;
}

/**
 * The theme name, editable in place. Click it to edit; commit on Enter or blur, cancel on Escape.
 * On a locked revision it is plain text. Kept controlled so an external rename (or reload) syncs the
 * field.
 */
const NameField = ({
    name,
    readOnly,
    onRename
}: {
    name: string;
    readOnly: boolean;
    onRename: (name: string) => void;
}) => {
    const [editing, setEditing] = useState(false);
    const [value, setValue] = useState(name);

    useEffect(() => setValue(name), [name]);

    if (readOnly) {
        return (
            <Text size="md" className="block font-semibold truncate">
                {name}
            </Text>
        );
    }

    const commit = () => {
        setEditing(false);
        const next = value.trim();
        if (next && next !== name) {
            onRename(next);
        } else {
            setValue(name);
        }
    };

    if (editing) {
        return (
            <Input
                autoFocus={true}
                value={value}
                onChange={setValue}
                onBlur={commit}
                onKeyDown={event => {
                    if (event.key === "Enter") {
                        commit();
                    } else if (event.key === "Escape") {
                        setValue(name);
                        setEditing(false);
                    }
                }}
            />
        );
    }

    return (
        <button
            type="button"
            onClick={() => setEditing(true)}
            title="Rename theme"
            className="group/name flex w-full items-center gap-xs text-left cursor-pointer"
        >
            <Text size="md" className="block font-semibold truncate">
                {name}
            </Text>
            <EditIcon className="size-4 flex-none fill-neutral-strong opacity-0 transition-opacity group-hover/name:opacity-100" />
        </button>
    );
};

/**
 * The left rail: what you are editing, and which part of it.
 *
 * Group order matters — colors first because it is what most people came for, policy last because
 * it is set once and then left alone. Each group carries an icon so the list is scannable at a
 * glance, and an amber dot marks a group whose current values raise an advisory warning.
 */
export const EditorRail = ({
    theme,
    isActive,
    activeVersion,
    onOpenActiveVersion,
    group,
    onGroupChange,
    warnings,
    readOnly,
    onRename
}: EditorRailProps) => {
    // The status is of the version being viewed: Active wins, else Published once the revision is
    // frozen (locked), else Draft. `locked` is per-revision; `lastPublishedOn` is entry-level and so
    // stays set on a fresh draft of an already-published theme — it can't tell draft from published.
    const viewedStatus = isActive ? "active" : theme.locked ? "published" : "draft";

    // Only worth pointing at the live version when it is a *different* one than you are looking at.
    const otherActiveVersion = !isActive ? activeVersion : null;

    return (
        <div className="w-[208px] flex-none border-r border-neutral-dimmed flex flex-col bg-neutral-base">
            <div className="p-md border-b border-neutral-dimmed">
                <NameField name={theme.properties.name} readOnly={readOnly} onRename={onRename} />

                <div className="flex items-center gap-sm mt-sm">
                    <Text size="md" className="font-mono font-semibold text-neutral-primary">
                        {`v${theme.version}`}
                    </Text>
                    {viewedStatus === "active" ? (
                        <Tag variant="accent" icon={<CheckCircleIcon />} content="Active" />
                    ) : viewedStatus === "published" ? (
                        <Tag variant="success-light" content="Published" />
                    ) : (
                        <Tag variant="neutral-light" content="Draft" />
                    )}
                </div>

                {otherActiveVersion !== null ? (
                    <button
                        type="button"
                        onClick={onOpenActiveVersion}
                        title={`Open the live version (v${otherActiveVersion})`}
                        className="mt-sm flex w-full items-center gap-xs rounded-sm bg-neutral-light px-sm py-xs cursor-pointer transition-colors hover:bg-neutral-dimmed"
                    >
                        <span className="size-2 flex-none rounded-full bg-primary" />
                        <Text size="sm" className="text-neutral-strong">
                            Live version
                        </Text>
                        <Text
                            size="sm"
                            className="ml-auto font-mono font-semibold text-neutral-strong"
                        >
                            {`v${otherActiveVersion}`}
                        </Text>
                    </button>
                ) : null}
            </div>

            <nav className="p-xs flex flex-col gap-[3px]">
                {EDITOR_GROUPS.map(item => {
                    const Icon = GROUP_ICONS[item.icon];
                    const selected = group === item.id;
                    const flagged = warnings.has(item.id);

                    return (
                        <button
                            key={item.id}
                            type="button"
                            onClick={() => onGroupChange(item.id)}
                            className={cn(
                                "flex items-center gap-sm rounded-sm px-sm-plus py-sm text-left text-md transition-colors cursor-pointer",
                                selected
                                    ? "bg-neutral-dimmed font-semibold text-neutral-primary"
                                    : "text-neutral-primary hover:bg-neutral-light"
                            )}
                        >
                            {Icon ? (
                                <Icon
                                    className={cn(
                                        "size-5 flex-none",
                                        selected ? "fill-neutral-xstrong" : "fill-neutral-strong"
                                    )}
                                />
                            ) : null}
                            <span className="flex-1 min-w-0 truncate">{item.label}</span>
                            {flagged ? (
                                <span
                                    className="size-2 flex-none rounded-full bg-warning-xstrong"
                                    aria-label="Needs attention"
                                    title="This section has an advisory warning"
                                />
                            ) : null}
                        </button>
                    );
                })}
            </nav>
        </div>
    );
};
