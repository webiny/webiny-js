import React from "react";
import { useEffect } from "react";
import { Button } from "@webiny/admin-ui";
import { Link } from "@webiny/admin-ui";
import { Table } from "@webiny/admin-ui";
import { Tag } from "@webiny/admin-ui";
import { Text } from "@webiny/admin-ui";
import { createReactiveComponent } from "@webiny/app-admin";
import { cn } from "@webiny/admin-ui";
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

    let stepDot: React.ReactNode = null;
    if (row.stepColor !== null) {
        stepDot = (
            <span
                className="inline-block size-[8px] shrink-0 rounded-full mr-sm"
                style={{ backgroundColor: row.stepColor }}
            />
        );
    }

    let contentType: React.ReactNode = null;
    if (showContentType) {
        contentType = (
            <Table.Cell>
                <div>{row.contentTypeLabel ?? ""}</div>
                <div className="text-[12px] text-neutral-muted">{row.contentTypeApp}</div>
            </Table.Cell>
        );
    }

    // A leaving row fades to 35 % and is dropped once its transition ends (QBZ-71); a row that
    // changed is highlighted (QBZ-86).
    const onTransitionEnd = (event: React.TransitionEvent<HTMLElement>) => {
        // Transitions of children (hover colours) bubble up; only the row's own fade counts.
        if (event.target !== event.currentTarget) {
            return;
        }
        presenter.removeLeavingRow(row.reviewId);
    };

    const className = cn("transition-opacity duration-500 motion-reduce:transition-none", {
        "opacity-35": row.leaving,
        "bg-primary-subtle": row.highlighted
    });

    return (
        <Table.Row
            className={className}
            data-review-id={row.reviewId}
            onTransitionEnd={onTransitionEnd}
        >
            <Table.Cell>{title}</Table.Cell>
            {contentType}
            <Table.Cell>
                <div className="flex items-center">
                    {stepDot}
                    {row.stepTitle ?? ""}
                </div>
            </Table.Cell>
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

    // React 18 has no `onTransitionCancel`. A cancelled fade (the row unmounts or hides mid-fade)
    // never ends, so the row would stay at 35 % forever: listen natively, for the row's own event.
    useEffect(() => {
        const onTransitionCancel = (event: TransitionEvent) => {
            const target = event.target;
            if (!(target instanceof HTMLElement)) {
                return;
            }
            const reviewId = target.getAttribute("data-review-id");
            if (reviewId) {
                presenter.removeLeavingRow(reviewId);
            }
        };
        document.addEventListener("transitioncancel", onTransitionCancel);
        return () => document.removeEventListener("transitioncancel", onTransitionCancel);
    }, [presenter]);

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
