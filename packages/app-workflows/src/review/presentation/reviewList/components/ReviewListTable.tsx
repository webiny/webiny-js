import React from "react";
import { Button } from "@webiny/admin-ui";
import { FormComponentNote } from "@webiny/admin-ui";
import { Link } from "@webiny/admin-ui";
import { Table } from "@webiny/admin-ui";
import { Tag } from "@webiny/admin-ui";
import { Text } from "@webiny/admin-ui";
import { createReactiveComponent } from "@webiny/app-admin";
import type { ReviewListPresenter } from "../abstractions.js";
import type { ReviewListRowVm } from "../abstractions.js";
import { REVIEW_TAG_ICONS } from "~/review/presentation/targetReview/components/reviewBarAppearance.js";
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

    let stepState: React.ReactNode = null;
    if (row.stepStateLabel) {
        let icon: React.ReactElement | undefined = undefined;
        if (row.stepStateIcon) {
            const StateIcon = REVIEW_TAG_ICONS[row.stepStateIcon];
            icon = <StateIcon />;
        }
        stepState = <Tag variant={row.stepStateVariant} content={row.stepStateLabel} icon={icon} />;
    }

    let step: React.ReactNode = null;
    if (row.stepTitle !== null) {
        let swatchColor: string | undefined = undefined;
        if (row.stepColor !== null) {
            swatchColor = row.stepColor;
        }
        step = (
            <Tag
                content={
                    <Text data-role="current-step-text" size="sm">
                        {row.stepTitle}
                    </Text>
                }
                swatchColor={swatchColor}
            />
        );
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
            <Table.Cell>{step}</Table.Cell>
            <Table.Cell>{stepState}</Table.Cell>
            <Table.Cell>{row.ownerLabel ?? ""}</Table.Cell>
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

    let sortTitle = "Oldest change first";
    let sortArrow = "↑";
    if (vm.sort === "lastChangedOn_DESC") {
        sortTitle = "Newest change first";
        sortArrow = "↓";
    }

    let footer: React.ReactNode = <Text size="sm">{"That's everything."}</Text>;
    if (vm.hasMore) {
        footer = (
            <Button
                variant="tertiary"
                text={vm.loadingMore ? "Loading…" : "Load more"}
                disabled={vm.loadingMore}
                onClick={() => presenter.loadMore()}
            />
        );
    }

    return (
        <>
            <Table bordered>
                <Table.Header>
                    <Table.Row>
                        <Table.Head>Title</Table.Head>
                        {contentTypeHead}
                        <Table.Head>Current step</Table.Head>
                        <Table.Head>Step state</Table.Head>
                        <Table.Head>Owner</Table.Head>
                        <Table.Head>Requester</Table.Head>
                        <Table.Head>
                            <button
                                type="button"
                                title={sortTitle}
                                onClick={() => presenter.toggleSort()}
                            >
                                {`Last change ${sortArrow}`}
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
            <div className="flex justify-center py-md">{footer}</div>
        </>
    );
});
