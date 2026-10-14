import React from "react";
import { createReactiveComponent } from "@webiny/app-admin";
import { Avatar, Button, Icon, Text, Tooltip, cn } from "@webiny/admin-ui";
import { ReactComponent as SwapIcon } from "@webiny/icons/swap_vert.svg";
import { ReactComponent as ErrorIcon } from "@webiny/icons/error.svg";
import type { JobListItemDto } from "~/shared/types.js";
import {
    StageKindChip,
    StagePips,
    runStageStatuses,
    stageMeta
} from "~/presentation/shared/index.js";
import type { ExtractionListPresenter } from "../abstractions.js";
import {
    BOARD_COLUMNS,
    type BoardColumn,
    boardColumn,
    cardStage,
    failureOf,
    jobOwner,
    ownerOf,
    sortColumn,
    timingOf,
    timingText
} from "../jobBoard.js";

/** Cards a column shows before "Show more". */
const COLUMN_PAGE = 6;

/** Each column's accent: the status colour on its header's top edge. */
const ACCENT: Record<BoardColumn, string> = {
    "needs-review": "border-t-warning-default",
    running: "border-t-accent-default",
    failed: "border-t-destructive-default",
    "not-started": "border-t-neutral-strong",
    complete: "border-t-success-default"
};

/** The owner, as an avatar with initials and a name; the account as recorded on hover. */
export const OwnerBadge = ({ item }: { item: JobListItemDto }) => {
    const owner = ownerOf(jobOwner(item.job));
    return (
        <Tooltip
            content={owner.account}
            trigger={
                <span className="flex min-w-0 flex-1 cursor-default items-center gap-xs">
                    <Avatar
                        size="sm"
                        variant={owner.shared ? "light" : "subtle"}
                        fallback={<Avatar.Fallback>{owner.initials}</Avatar.Fallback>}
                    />
                    <Text size="sm" className="truncate text-neutral-primary">
                        {owner.label}
                    </Text>
                </span>
            }
        />
    );
};

/** The card's stage line: the stage it is at, or what a complete job produced. */
const StageLine = ({ item, column }: { item: JobListItemDto; column: BoardColumn }) => {
    const run = item.latestRun;
    if (!run) {
        return (
            <Text size="sm" className="text-neutral-strong">
                No run yet
            </Text>
        );
    }
    if (column === "complete") {
        return (
            <Text size="sm" className="text-neutral-strong">
                {run.counts.components} components · {run.counts.pages} pages
            </Text>
        );
    }
    const stage = cardStage(run);
    const meta = stage ? stageMeta(stage) : null;
    if (!meta) {
        return null;
    }
    return (
        <span className="flex items-center gap-xs">
            <Text size="sm" className="text-neutral-strong">
                {column === "needs-review" ? "Next: " : ""}
                {meta.number} · {meta.label}
            </Text>
            <StageKindChip kind={meta.kind} />
        </span>
    );
};

const JobCard = ({
    item,
    column,
    onOpen
}: {
    item: JobListItemDto;
    column: BoardColumn;
    onOpen: () => void;
}) => {
    const timing = timingOf(item);
    const failure = failureOf(item.latestRun);
    return (
        <div
            role="button"
            tabIndex={0}
            onClick={onOpen}
            onKeyDown={event => {
                if (event.key === "Enter") {
                    onOpen();
                }
            }}
            className="flex cursor-pointer flex-col gap-sm rounded-lg border border-neutral-dimmed bg-neutral-base px-sm-extra py-sm-extra shadow-sm hover:border-neutral-muted"
        >
            <div className="flex min-w-0 flex-col">
                <Text size="md" className="truncate font-semibold text-neutral-primary">
                    {item.job.name}
                </Text>
                <Text size="sm" className="truncate text-neutral-muted" title={item.job.siteUrl}>
                    {item.job.siteUrl.replace(/^https?:\/\//, "").replace(/\/$/, "")}
                </Text>
            </div>
            <div className="flex flex-col gap-xs">
                <StageLine item={item} column={column} />
                <StagePips statuses={runStageStatuses(item.latestRun)} />
            </div>
            {failure ? (
                <span className="flex items-start gap-xs" title={failure}>
                    <Icon
                        icon={<ErrorIcon />}
                        label="Failed"
                        size="sm"
                        className="fill-destructive-default"
                    />
                    <Text size="sm" className="line-clamp-2 text-destructive-primary">
                        {failure}
                    </Text>
                </span>
            ) : null}
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-sm border-t border-neutral-dimmed pt-sm">
                <div className="min-w-0 overflow-hidden">
                    <OwnerBadge item={item} />
                </div>
                <Text
                    size="sm"
                    className="flex-shrink-0 whitespace-nowrap text-neutral-muted"
                    title={timing.at ? new Date(timing.at).toLocaleString() : undefined}
                >
                    {timingText(timing)}
                </Text>
            </div>
        </div>
    );
};

interface BoardProps {
    presenter: ExtractionListPresenter.Interface;
    items: JobListItemDto[];
    onOpen: (jobId: string) => void;
}

/**
 * The board: one column per status, each with its count, its order and "Show more". No admin-ui
 * primitive is a board column or card, so both are built from its tokens, like the Site step's panels.
 */
export const JobBoard = createReactiveComponent(function JobBoard({
    presenter,
    items,
    onOpen
}: BoardProps) {
    const { vm } = presenter;
    return (
        <div className="grid min-w-[1180px] grid-cols-5 gap-md">
            {BOARD_COLUMNS.map(({ key, label }) => {
                const order = vm.columnOrder[key];
                const jobs = sortColumn(
                    items.filter(item => boardColumn(item.latestRun) === key),
                    order
                );
                const open = vm.expanded.includes(key);
                const shown = open ? jobs : jobs.slice(0, COLUMN_PAGE);
                return (
                    <div key={key} className="flex min-w-0 flex-col gap-sm">
                        <div
                            className={cn(
                                "flex items-center justify-between gap-xs rounded-lg border border-t-2 border-neutral-dimmed bg-neutral-base px-sm-extra py-sm",
                                ACCENT[key]
                            )}
                        >
                            <span className="flex min-w-0 items-baseline gap-xs whitespace-nowrap">
                                <Text size="md" className="font-semibold text-neutral-primary">
                                    {label}
                                </Text>
                                <Text size="sm" className="text-neutral-muted">
                                    {jobs.length}
                                </Text>
                            </span>
                            <Button
                                variant="ghost"
                                size="sm"
                                icon={<SwapIcon />}
                                text={order === "oldest" ? "Oldest" : "Newest"}
                                title={order === "oldest" ? "Oldest first" : "Newest first"}
                                onClick={() => presenter.toggleColumnOrder(key)}
                            />
                        </div>
                        <div className="flex flex-col gap-sm rounded-lg bg-neutral-light p-xs">
                            {shown.length === 0 ? (
                                <Text
                                    size="sm"
                                    className="px-sm py-md text-center text-neutral-muted"
                                >
                                    None
                                </Text>
                            ) : null}
                            {shown.map(item => (
                                <JobCard
                                    key={item.job.id}
                                    item={item}
                                    column={key}
                                    onOpen={() => onOpen(item.job.id)}
                                />
                            ))}
                            {jobs.length > shown.length ? (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    text={`Show more · ${jobs.length - shown.length}`}
                                    onClick={() => presenter.expandColumn(key)}
                                />
                            ) : null}
                        </div>
                    </div>
                );
            })}
        </div>
    );
});
