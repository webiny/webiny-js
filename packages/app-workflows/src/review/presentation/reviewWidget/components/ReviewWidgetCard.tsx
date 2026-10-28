import React from "react";
import { useEffect } from "react";
import { Button } from "@webiny/admin-ui";
import { EmptyState } from "@webiny/admin-ui";
import { Link } from "@webiny/admin-ui";
import { List } from "@webiny/admin-ui";
import { Widget } from "@webiny/admin-ui";
import { ReactComponent as ArrowForwardIcon } from "@webiny/icons/arrow_forward.svg";
import { SegmentedControl } from "@webiny/admin-ui";
import { Skeleton } from "@webiny/admin-ui";
import { createReactiveComponent } from "@webiny/app-admin";
import { useFeature } from "@webiny/app";
import type { WorkflowAppKind } from "~/domain/WorkflowAppKind.js";
import type { IReviewRowProvider } from "~/review/presentation/reviewList/abstractions.js";
import type { ReviewListTab } from "~/review/presentation/reviewList/abstractions.js";
import { getReviewListEmpty } from "~/review/presentation/reviewList/getReviewListEmpty.js";
import type { ReviewWidgetKind } from "../abstractions.js";
import type { ReviewWidgetTab } from "../abstractions.js";
import { ReviewWidgetPresenterFeature } from "../feature.js";
import { ReviewWidgetRow } from "./ReviewWidgetRow.js";
import { WIDGET_APP_LABELS } from "../../widgetAppLabels.js";

export interface ReviewWidgetCardProps {
    kind: ReviewWidgetKind;
    title: string;
    icon: React.ReactElement;
    app: WorkflowAppKind;
    namespaces: string[];
    rowProvider: IReviewRowProvider;
    viewAllUrl: (tab: ReviewListTab) => string;
}

const SEGMENTS = [
    { label: "Assigned to me", value: "assignedToMe" },
    { label: "Team pool", value: "pool" }
];

const SKELETON_ROWS = [0, 1, 2];

// The shared card of both widgets: an admin-ui Widget with the segment in its header, the rows or a
// state in its body and "View all" in its footer.
export const ReviewWidgetCard = createReactiveComponent((props: ReviewWidgetCardProps) => {
    const { kind, title, icon, app, namespaces, rowProvider, viewAllUrl } = props;
    const { presenter } = useFeature(ReviewWidgetPresenterFeature);
    const namespacesKey = namespaces.join("|");

    useEffect(() => {
        void presenter.init({ app, namespaces, kind, rowProvider });
        return () => {
            presenter.dispose();
        };
    }, [presenter, app, rowProvider, namespacesKey, kind]);

    const vm = presenter.vm;

    let segment: React.ReactNode = null;
    if (vm.tab) {
        const onChange = (value: string) => {
            if (value === "assignedToMe" || value === "pool") {
                const tab: ReviewWidgetTab = value;
                void presenter.setTab(tab);
            }
        };
        segment = <SegmentedControl items={SEGMENTS} value={vm.tab} onChange={onChange} />;
    }

    let body: React.ReactNode = null;
    if (vm.status === "loading") {
        body = (
            <div data-testid="review-widget-loading" className="flex flex-col gap-md p-md">
                {SKELETON_ROWS.map(index => (
                    <Skeleton key={index} type="text" />
                ))}
            </div>
        );
    } else if (vm.status === "failed") {
        body = (
            <EmptyState
                type="table"
                size="sm"
                title="Could not load reviews."
                actions={
                    <Button
                        size="sm"
                        variant="tertiary"
                        text="Try again"
                        onClick={() => presenter.refresh()}
                    />
                }
            />
        );
    } else if (vm.empty) {
        const empty = getReviewListEmpty(vm.tab ?? "myRequests", false, vm.hasTeams);
        body = (
            <EmptyState
                type="table"
                size="sm"
                title={empty.title}
                description={empty.description}
            />
        );
    } else {
        body = (
            <List>
                {vm.rows.map(row => (
                    <ReviewWidgetRow key={row.reviewId} row={row} />
                ))}
            </List>
        );
    }

    const viewAllTab: ReviewListTab = vm.tab ?? "myRequests";

    return (
        <div data-testid={`review-widget-${kind}`}>
            <Widget
                title={title}
                description={WIDGET_APP_LABELS[app]}
                icon={<Widget.Icon icon={icon} label={`${title} icon`} />}
                padding="sm"
                bodyPadding={false}
                headerActions={segment}
                footerEndActions={
                    <Widget.Action
                        asChild
                        variant="ghost"
                        size="sm"
                        icon={<ArrowForwardIcon />}
                        iconPosition="end"
                    >
                        <Link to={viewAllUrl(viewAllTab)}>View all</Link>
                    </Widget.Action>
                }
            >
                <div className="flex flex-col">{body}</div>
            </Widget>
        </div>
    );
});
