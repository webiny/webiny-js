import React from "react";
import { Button } from "@webiny/admin-ui";
import { Icon } from "@webiny/admin-ui";
import { Input } from "@webiny/admin-ui";
import { Skeleton } from "@webiny/admin-ui";
import { Text } from "@webiny/admin-ui";
import { cn } from "@webiny/admin-ui";
import { ReactComponent as AccountTreeIcon } from "@webiny/icons/account_tree.svg";
import type { ModelPanelVm } from "~/editor/presentation/editor/abstractions.js";
import type { ModelRowVm } from "~/editor/presentation/editor/abstractions.js";

export interface ModelPanelProps {
    panel: ModelPanelVm;
    renderIcon(modelId: string): React.ReactNode;
    onSearch(search: string): void;
    onSelect(modelId: string): void;
    onLoadMore(): void;
    onRetry(): void;
}

interface ModelRowProps {
    row: ModelRowVm;
    icon: React.ReactNode;
    onSelect(modelId: string): void;
}

const SKELETON_ROWS = [0, 1, 2, 3];

const ModelRow = ({ row, icon, onSelect }: ModelRowProps) => {
    const rowClass = cn(
        "flex w-full items-center gap-sm px-sm py-xs rounded-md text-left",
        row.active && "bg-neutral-dimmed",
        !row.active && "hover:bg-neutral-light"
    );
    const nameClass = cn("text-md truncate", row.active && "font-semibold");
    let ariaCurrent: "true" | undefined = undefined;
    if (row.active) {
        ariaCurrent = "true";
    }

    let boundIndicator: React.ReactNode = null;
    if (row.bound) {
        boundIndicator = (
            <Icon
                icon={<AccountTreeIcon />}
                label="Has a workflow"
                size="sm"
                className="fill-success"
            />
        );
    }

    let unsavedDot: React.ReactNode = null;
    if (row.unsaved) {
        unsavedDot = (
            <span
                role="img"
                aria-label="Unsaved changes"
                className="shrink-0 size-sm rounded-full bg-primary"
            />
        );
    }

    return (
        <button
            type="button"
            aria-current={ariaCurrent}
            className={rowClass}
            onClick={() => onSelect(row.modelId)}
        >
            <span className="shrink-0 flex items-center justify-center size-lg">{icon}</span>
            <span className="flex flex-col min-w-0 grow">
                <span className={nameClass}>{row.name}</span>
                <span className="text-sm text-neutral-strong truncate">{row.subLine}</span>
            </span>
            {boundIndicator}
            {unsavedDot}
        </button>
    );
};

// The model panel: label, optional search, rows with icon, name, sub line and indicators, Load more.
export const ModelPanel = (props: ModelPanelProps) => {
    const { panel } = props;

    let searchInput: React.ReactNode = null;
    if (panel.showSearch) {
        searchInput = (
            <Input value={panel.search} onChange={props.onSearch} placeholder="Search models" />
        );
    }

    let list: React.ReactNode = null;
    if (panel.loading) {
        list = (
            <div data-testid="model-panel-loading" className="flex flex-col gap-sm">
                {SKELETON_ROWS.map(row => (
                    <Skeleton key={row} type="text" />
                ))}
            </div>
        );
    } else if (panel.emptyText !== null) {
        list = (
            <Text size="md" className="px-sm text-neutral-strong">
                {panel.emptyText}
            </Text>
        );
    } else {
        list = (
            <div className="flex flex-col gap-xxs">
                {panel.rows.map(row => (
                    <ModelRow
                        key={row.modelId}
                        row={row}
                        icon={props.renderIcon(row.modelId)}
                        onSelect={props.onSelect}
                    />
                ))}
            </div>
        );
    }

    let error: React.ReactNode = null;
    if (panel.error !== null) {
        error = (
            <div className="flex flex-col items-start gap-xs px-sm">
                <Text size="sm" className="text-destructive-primary">
                    {panel.error}
                </Text>
                <Button variant="tertiary" size="sm" text="Try again" onClick={props.onRetry} />
            </div>
        );
    }

    let loadMore: React.ReactNode = null;
    if (panel.hasMore && !panel.loading) {
        loadMore = (
            <Button
                variant="tertiary"
                size="sm"
                text="Load more"
                disabled={panel.loadingMore}
                onClick={props.onLoadMore}
            />
        );
    }

    return (
        <div
            data-testid="model-panel"
            className="flex flex-col gap-sm p-md overflow-y-auto border-r border-neutral-dimmed"
        >
            <Text
                as="div"
                size="sm"
                className="px-sm uppercase tracking-[0.04em] font-semibold text-neutral-strong"
            >
                {panel.label}
            </Text>
            {searchInput}
            {list}
            {error}
            {loadMore}
        </div>
    );
};
