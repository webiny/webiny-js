import React from "react";
import { Button } from "@webiny/admin-ui";
import { Icon } from "@webiny/admin-ui";
import { List } from "@webiny/admin-ui";
import { Input } from "@webiny/admin-ui";
import { Skeleton } from "@webiny/admin-ui";
import { Text } from "@webiny/admin-ui";
import { ReactComponent as SearchIcon } from "@webiny/icons/search.svg";
import { ReactComponent as AccountTreeIcon } from "@webiny/icons/account_tree.svg";
import { ReactComponent as DotIcon } from "@webiny/icons/fiber_manual_record.svg";
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
    let ariaCurrent: "true" | undefined = undefined;
    if (row.active) {
        ariaCurrent = "true";
    }

    const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
        if (event.target !== event.currentTarget) {
            return;
        }
        if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            onSelect(row.modelId);
        }
    };

    let boundIndicator: React.ReactNode = null;
    if (row.bound) {
        boundIndicator = <Icon icon={<AccountTreeIcon />} label="Has a workflow" size="sm" />;
    }

    let unsavedDot: React.ReactNode = null;
    if (row.unsaved) {
        unsavedDot = <Icon icon={<DotIcon />} label="Unsaved changes" size="xs" color="accent" />;
    }

    let actions: React.ReactNode = null;
    if (boundIndicator !== null || unsavedDot !== null) {
        actions = (
            <>
                {boundIndicator}
                {unsavedDot}
            </>
        );
    }

    return (
        <List.Item
            role="button"
            data-testid={`model-row-${row.modelId}`}
            aria-current={ariaCurrent}
            selected={row.active}
            icon={icon}
            title={row.name}
            description={row.subLine}
            actions={actions}
            onClick={() => onSelect(row.modelId)}
            onKeyDown={handleKeyDown}
        />
    );
};

// The model panel: label, optional search, rows with icon, name, sub line and indicators, Load more.
export const ModelPanel = (props: ModelPanelProps) => {
    const { panel } = props;

    let searchInput: React.ReactNode = null;
    if (panel.showSearch) {
        searchInput = (
            <Input
                value={panel.search}
                onChange={props.onSearch}
                placeholder="Search models"
                startIcon={<Icon icon={<SearchIcon />} label={""} size={"sm"} />}
            />
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
        list = <Text size="sm">{panel.emptyText}</Text>;
    } else {
        list = (
            <List>
                {panel.rows.map(row => (
                    <ModelRow
                        key={row.modelId}
                        row={row}
                        icon={props.renderIcon(row.modelId)}
                        onSelect={props.onSelect}
                    />
                ))}
            </List>
        );
    }

    let error: React.ReactNode = null;
    if (panel.error !== null) {
        error = (
            <div className="flex flex-col items-start gap-xs">
                <Text size="sm">{panel.error}</Text>
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
        <div data-testid="model-panel" className="flex flex-col gap-sm p-md overflow-y-auto">
            <Text as="div" size="sm">
                {panel.label}
            </Text>
            {searchInput}
            {list}
            {error}
            {loadMore}
        </div>
    );
};
