import React from "react";
import { Button } from "@webiny/admin-ui";
import { FormComponentNote } from "@webiny/admin-ui";
import { Link } from "@webiny/admin-ui";
import { Separator } from "@webiny/admin-ui";
import { Table } from "@webiny/admin-ui";
import { Text } from "@webiny/admin-ui";
import { createReactiveComponent } from "@webiny/app-admin";
import type { ReviewListPresenter } from "../abstractions.js";
import type { ReviewListRowVm } from "../abstractions.js";
import type { TargetReviewTag } from "~/review/presentation/targetReview/abstractions.js";
import { WorkflowStatus } from "~/review/presentation/components/WorkflowStatus.js";
import { ReviewListRowActions } from "./ReviewListRowActions.js";

export interface ReviewListTableProps {
    presenter: ReviewListPresenter.Interface;
    showContentType: boolean;
}

interface ReviewListTableRowProps {
    row: ReviewListRowVm;
    presenter: ReviewListPresenter.Interface;
    showContentType: boolean;
}

const ReviewListTableRow = ({ row, presenter, showContentType }: ReviewListTableRowProps) => {
    let title: React.ReactNode = row.title;
    if (row.contentUrl) {
        title = (
            <Link to={row.contentUrl} variant="secondary">
                {row.title}
            </Link>
        );
    }

    let stepState: TargetReviewTag | null = null;
    if (row.stepStateLabel) {
        stepState = { label: row.stepStateLabel, variant: row.stepStateVariant };
        if (row.stepStateIcon) {
            stepState.icon = row.stepStateIcon;
        }
    }

    let contentType: React.ReactNode = null;
    if (showContentType) {
        contentType = (
            <Table.Cell>
                <Text as="div">{row.contentTypeLabel ?? ""}</Text>
                <FormComponentNote className="mt-0" text={row.contentTypeApp} />
            </Table.Cell>
        );
    }

    return (
        <Table.Row
            selected={row.highlighted}
            data-highlighted={row.highlighted ? "" : undefined}
            data-review-id={row.reviewId}
        >
            <Table.Cell>
                <div className="flex items-center gap-sm">
                    {row.contentTypeIcon}
                    {title}
                </div>
            </Table.Cell>
            {contentType}
            <Table.Cell>
                <WorkflowStatus
                    step={row.stepTitle}
                    stepColor={row.stepColor}
                    state={stepState}
                    owner={row.ownerLabel}
                />
            </Table.Cell>
            <Table.Cell>{row.requesterName}</Table.Cell>
            <Table.Cell>{row.lastChange}</Table.Cell>
            <Table.Cell>
                <ReviewListRowActions row={row} presenter={presenter} />
            </Table.Cell>
        </Table.Row>
    );
};

export const ReviewListTable = createReactiveComponent((props: ReviewListTableProps) => {
    const { presenter, showContentType } = props;
    const vm = presenter.vm;

    let contentTypeHead: React.ReactNode = null;
    if (showContentType) {
        contentTypeHead = <Table.Head>Content type</Table.Head>;
    }

    // One sort at a time: only the active column shows its arrow.
    let titleSortTitle = "Sort by name, A to Z";
    let titleLabel = "Name";
    if (vm.sort === "title_ASC") {
        titleSortTitle = "Name, A to Z";
        titleLabel = "Name ↑";
    } else if (vm.sort === "title_DESC") {
        titleSortTitle = "Name, Z to A";
        titleLabel = "Name ↓";
    }
    let lastChangeSortTitle = "Sort by modified date, oldest first";
    let lastChangeLabel = "Modified";
    if (vm.sort === "lastChangedOn_ASC") {
        lastChangeSortTitle = "Oldest change first";
        lastChangeLabel = "Modified ↑";
    } else if (vm.sort === "lastChangedOn_DESC") {
        lastChangeSortTitle = "Newest change first";
        lastChangeLabel = "Modified ↓";
    }

    // The same bar as the CMS entry list (app-admin ListView.BottomBar); the API gives no total.
    const shownLabel = vm.rows.length === 1 ? "review" : "reviews";
    const shownText = `Showing ${vm.rows.length} ${shownLabel}.`;

    let loadMore: React.ReactNode = null;
    if (vm.hasMore) {
        loadMore = (
            <Button
                variant="tertiary"
                size="sm"
                text={vm.loadingMore ? "Loading…" : "Load more"}
                disabled={vm.loadingMore}
                onClick={() => presenter.loadMore()}
            />
        );
    }

    return (
        <>
            <Table sticky>
                <Table.Header sticky>
                    <Table.Row>
                        <Table.Head>
                            <button
                                type="button"
                                title={titleSortTitle}
                                onClick={() => presenter.toggleSort("title")}
                            >
                                {titleLabel}
                            </button>
                        </Table.Head>
                        {contentTypeHead}
                        <Table.Head>Workflow</Table.Head>
                        <Table.Head>Requested by</Table.Head>
                        <Table.Head>
                            <button
                                type="button"
                                title={lastChangeSortTitle}
                                onClick={() => presenter.toggleSort("lastChangedOn")}
                            >
                                {lastChangeLabel}
                            </button>
                        </Table.Head>
                        <Table.Head />
                    </Table.Row>
                </Table.Header>
                <Table.Body>
                    {vm.rows.map(row => (
                        <ReviewListTableRow
                            key={row.reviewId}
                            row={row}
                            presenter={presenter}
                            showContentType={showContentType}
                        />
                    ))}
                </Table.Body>
            </Table>
            <div data-role="review-list-footer">
                <Separator />
                <div className="h-xl px-md py-sm flex items-center justify-between">
                    <Text size="sm" as="div">
                        {shownText}
                    </Text>
                    {loadMore}
                </div>
            </div>
        </>
    );
});
