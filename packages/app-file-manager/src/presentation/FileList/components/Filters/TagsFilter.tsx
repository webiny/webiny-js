import React, { useCallback, useState } from "react";
import { observer } from "mobx-react-lite";
import { Select, Tag as AdminTag, Text } from "@webiny/admin-ui";
import { i18n } from "@webiny/app/i18n/index.js";
import { useFileListPresenter } from "../../FileListPresenterProvider.js";

const t = i18n.ns("app-file-manager/presentation/tags-filter");

const FILTER_MODE_OPTIONS = [
    { value: "OR", label: "match any" },
    { value: "AND", label: "match all" }
];

/**
 * Tags filter component wired to the FileListPresenter.
 * Reads available tags from vm.tags, supports AND/OR filter modes,
 * and dispatches changes via presenter.actions.filter.set("tags", ...).
 */
export const TagsFilter = observer(function TagsFilter() {
    const { vm, actions } = useFileListPresenter();
    const [filterMode, setFilterMode] = useState<"AND" | "OR">("OR");

    // Read the current active tags from the filter state.
    const activeTags = (vm.list.filters["tags"] as string[] | undefined) ?? [];

    // Toggle a tag in the active tags list.
    const toggleTag = useCallback(
        (tag: string) => {
            const updated = activeTags.includes(tag)
                ? activeTags.filter(t => t !== tag)
                : [...activeTags, tag];

            if (updated.length > 0) {
                actions.filter.set("tags", updated);
                // Store the filter mode alongside the tags.
                actions.filter.set("tags_rule", filterMode);
            } else {
                actions.filter.clear("tags");
                actions.filter.clear("tags_rule");
            }
        },
        [activeTags, actions.filter, filterMode]
    );

    // Handle filter mode change.
    const handleModeChange = useCallback(
        (mode: string) => {
            const typedMode = mode as "AND" | "OR";
            setFilterMode(typedMode);
            // Re-apply the filter with the new mode if tags are active.
            if (activeTags.length > 0) {
                actions.filter.set("tags_rule", typedMode);
            }
        },
        [activeTags, actions.filter]
    );

    if (vm.tags.length === 0) {
        return (
            <div className={"flex flex-col gap-sm"}>
                <Text size={"sm"} className={"text-neutral-dimmed"}>
                    {t`No tags found.`}
                </Text>
            </div>
        );
    }

    return (
        <div className={"flex flex-col gap-sm"}>
            <Text className={"font-semibold"}>{t`Filter by tag`}</Text>
            {vm.tags.length > 1 && (
                <Select
                    disabled={activeTags.length < 2}
                    size={"md"}
                    variant={"secondary"}
                    value={filterMode}
                    onChange={handleModeChange}
                    options={FILTER_MODE_OPTIONS}
                    displayResetAction={false}
                    data-testid={"fm-tags-filter-mode"}
                />
            )}
            {activeTags.length > 0 && (
                <div className={"flex flex-wrap gap-xs"} data-testid={"fm-tags-filter-active"}>
                    {activeTags.map(tag => (
                        <AdminTag
                            key={tag}
                            variant={"accent"}
                            content={tag}
                            onDismiss={() => toggleTag(tag)}
                        />
                    ))}
                </div>
            )}
            <div className={"flex flex-col gap-sm"} data-testid={"fm-tags-filter-list"}>
                {vm.tags.map(tagItem => (
                    <AdminTag
                        key={tagItem.tag}
                        variant={activeTags.includes(tagItem.tag) ? "accent" : "neutral-muted"}
                        content={tagItem.tag}
                        onClick={() => toggleTag(tagItem.tag)}
                        onDismiss={
                            activeTags.includes(tagItem.tag)
                                ? () => toggleTag(tagItem.tag)
                                : undefined
                        }
                    />
                ))}
            </div>
        </div>
    );
});
