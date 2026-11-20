import React from "react";
import { Alert } from "@webiny/admin-ui";
import { DropdownMenu } from "@webiny/admin-ui";
import { IconButton } from "@webiny/admin-ui";
import { SegmentedControl } from "@webiny/admin-ui";
import { Button } from "@webiny/admin-ui";
import { Icon } from "@webiny/admin-ui";
import { List } from "@webiny/admin-ui";
import { Input } from "@webiny/admin-ui";
import { Skeleton } from "@webiny/admin-ui";
import { Tag } from "@webiny/admin-ui";
import { Text } from "@webiny/admin-ui";
import { ReactComponent as SearchIcon } from "@webiny/icons/search.svg";
import { ReactComponent as MoreVerticalIcon } from "@webiny/icons/more_vert.svg";
import { ReactComponent as AddIcon } from "@webiny/icons/add.svg";
import { ReactComponent as DeleteIcon } from "@webiny/icons/delete.svg";
import { ReactComponent as AccountTreeIcon } from "@webiny/icons/account_tree.svg";
import type { ModelPanelVm } from "~/editor/presentation/editor/abstractions.js";
import type { ModelWorkflowFilter } from "~/editor/presentation/editor/abstractions.js";
import type { ModelRowVm } from "~/editor/presentation/editor/abstractions.js";

export interface ModelPanelProps {
    panel: ModelPanelVm;
    renderIcon(modelId: string): React.ReactNode;
    onSearch(search: string): void;
    onFilter(filter: ModelWorkflowFilter): void;
    onSelect(modelId: string): void;
    onCreateWorkflow(modelId: string): void;
    onDeleteWorkflow(modelId: string): void;
    onLoadMore(): void;
    onRetry(): void;
}

interface ModelRowProps {
    row: ModelRowVm;
    icon: React.ReactNode;
    onSelect(modelId: string): void;
    onCreateWorkflow(modelId: string): void;
    onDeleteWorkflow(modelId: string): void;
}

const FILTER_ITEMS = [
    { value: "all", label: "All" },
    { value: "with", label: "With" },
    { value: "without", label: "Without" }
];

const SKELETON_ROWS = [0, 1, 2, 3];

const ModelRow = ({ row, icon, onSelect, onCreateWorkflow, onDeleteWorkflow }: ModelRowProps) => {
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

    let unsavedTag: React.ReactNode = null;
    if (row.unsaved) {
        unsavedTag = <Tag variant="warning" content="Unsaved" aria-label="Unsaved changes" />;
    }

    let menuItem: React.ReactNode = (
        <DropdownMenu.Item
            icon={<AddIcon />}
            text="Create workflow"
            onClick={() => onCreateWorkflow(row.modelId)}
        />
    );
    if (row.bound) {
        menuItem = (
            <DropdownMenu.Item
                icon={<DeleteIcon />}
                text="Delete workflow"
                onClick={() => onDeleteWorkflow(row.modelId)}
            />
        );
    }

    const actions = (
        <>
            {boundIndicator}
            {unsavedTag}
            <DropdownMenu
                align="end"
                side="bottom"
                trigger={
                    <IconButton
                        variant="ghost"
                        disabled={row.actionsDisabled}
                        aria-label={`Actions for ${row.name}`}
                        title={`Actions for ${row.name}`}
                        icon={<MoreVerticalIcon />}
                    />
                }
            >
                {menuItem}
            </DropdownMenu>
        </>
    );

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

    let filterControl: React.ReactNode = null;
    if (panel.showFilter) {
        filterControl = (
            <SegmentedControl
                label="Workflow"
                items={FILTER_ITEMS}
                value={panel.filter}
                onChange={value => props.onFilter(value as ModelWorkflowFilter)}
                fullWidth
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
                        onCreateWorkflow={props.onCreateWorkflow}
                        onDeleteWorkflow={props.onDeleteWorkflow}
                    />
                ))}
            </List>
        );
    }

    let error: React.ReactNode = null;
    if (panel.error !== null) {
        error = (
            <Alert
                type="danger"
                variant="subtle"
                actions={<Alert.Action text="Try again" onClick={props.onRetry} />}
            >
                {panel.error}
            </Alert>
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
        <div data-testid="model-panel" className="flex flex-col gap-sm p-md">
            <Text as="div" size="sm">
                {panel.label}
            </Text>
            {searchInput}
            {filterControl}
            {list}
            {error}
            {loadMore}
        </div>
    );
};
