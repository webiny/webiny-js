import React from "react";
import { useEffect } from "react";
import { Alert } from "@webiny/admin-ui";
import { Heading } from "@webiny/admin-ui";
import { Skeleton } from "@webiny/admin-ui";
import { FormComponentDescription } from "@webiny/admin-ui";
import { ReactComponent as RefreshIcon } from "@webiny/icons/refresh.svg";
import { createReactiveComponent } from "@webiny/app-admin";
import { useFeature } from "@webiny/app";
import type { WorkflowAppKind } from "~/domain/WorkflowAppKind.js";
import type { IReviewContentTypeFilter } from "../IReviewContentTypeFilter.js";
import type { IReviewRowProvider } from "../abstractions.js";
import type { ReviewListTab } from "../abstractions.js";
import { ReviewListPresenterFeature } from "../feature.js";
import { ReviewListDialogs } from "./ReviewListDialogs.js";
import { ReviewListEmpty } from "./ReviewListEmpty.js";
import { ReviewListNotice } from "./ReviewListNotice.js";
import { ReviewListTable } from "./ReviewListTable.js";
import { ReviewListTabs } from "./ReviewListTabs.js";
import { ReviewListToolbar } from "./ReviewListToolbar.js";

export interface ReviewListViewProps {
    app: WorkflowAppKind;
    rowProvider: IReviewRowProvider;
    namespaces: string[];
    showContentType: boolean;
    contentTypeFilter: IReviewContentTypeFilter | null;
    initialTab?: ReviewListTab;
}

const SKELETON_ROWS = [0, 1, 2, 3, 4, 5];
const SKELETON_BARS = [0, 1, 2, 3];

const ReviewListSkeleton = () => {
    return (
        <div className="flex flex-col gap-md p-md">
            {SKELETON_ROWS.map(row => (
                <div
                    key={row}
                    data-testid="review-list-skeleton-row"
                    className="grid grid-cols-4 gap-md"
                >
                    {SKELETON_BARS.map(bar => (
                        <Skeleton key={bar} type="text" />
                    ))}
                </div>
            ))}
        </div>
    );
};

export const ReviewListView = createReactiveComponent((props: ReviewListViewProps) => {
    const { app, rowProvider, namespaces, showContentType, contentTypeFilter } = props;
    const initialTab = props.initialTab ?? "assignedToMe";
    const { presenter } = useFeature(ReviewListPresenterFeature);
    const namespacesKey = namespaces.join("|");

    useEffect(() => {
        void presenter.init({ app, namespaces, rowProvider, initialTab });
        return () => {
            presenter.dispose();
        };
    }, [presenter, app, rowProvider, namespacesKey, initialTab]);

    const vm = presenter.vm;

    let notice: React.ReactNode = null;
    if (vm.notice) {
        notice = <ReviewListNotice message={vm.notice} onShow={() => presenter.showNewReviews()} />;
    }

    let loadError: React.ReactNode = null;
    if (vm.status === "ready" && vm.error) {
        loadError = (
            <Alert type="danger" variant="subtle">
                {vm.error}
            </Alert>
        );
    }

    let body: React.ReactNode;
    if (vm.status === "loading") {
        body = <ReviewListSkeleton />;
    } else if (vm.status === "failed") {
        body = (
            <ReviewListEmpty
                title="Could not load reviews"
                description={vm.error ?? ""}
                actionLabel="Try again"
                actionIcon={<RefreshIcon />}
                onAction={() => presenter.refresh()}
            />
        );
    } else if (vm.empty) {
        let actionLabel: string | null = null;
        if (vm.isFiltered) {
            actionLabel = "Clear filters";
        }
        body = (
            <ReviewListEmpty
                title={vm.empty.title}
                description={vm.empty.description}
                actionLabel={actionLabel}
                onAction={() => presenter.clearFilters()}
            />
        );
    } else if (vm.rows.length > 0) {
        body = <ReviewListTable presenter={presenter} showContentType={showContentType} />;
    } else {
        body = null;
    }

    return (
        <div className="px-lg py-md">
            <div className="mb-md">
                <Heading level={3}>Content Reviews</Heading>
                <FormComponentDescription
                    className="mb-0"
                    text="Reviews you can act on or follow. Open the content to approve or reject."
                />
            </div>
            <ReviewListTabs presenter={presenter} />
            <div className="pt-md">
                <ReviewListToolbar
                    presenter={presenter}
                    showContentType={showContentType}
                    contentTypeFilter={contentTypeFilter}
                />
                {notice}
                {loadError}
                {body}
            </div>
            <ReviewListDialogs presenter={presenter} rowProvider={rowProvider} />
        </div>
    );
});
