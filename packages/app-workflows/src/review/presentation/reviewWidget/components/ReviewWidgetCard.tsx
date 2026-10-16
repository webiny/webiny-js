import React from "react";
import { useEffect } from "react";
import { Button } from "@webiny/admin-ui";
import { Link } from "@webiny/admin-ui";
import { SegmentedControl } from "@webiny/admin-ui";
import { Skeleton } from "@webiny/admin-ui";
import { Tag } from "@webiny/admin-ui";
import { Text } from "@webiny/admin-ui";
import { createReactiveComponent } from "@webiny/app-admin";
import { useFeature } from "@webiny/app";
import type { IReviewListUseCases } from "~/review/useCases/IReviewListUseCases.js";
import type { IReviewRowProvider } from "~/review/presentation/reviewList/abstractions.js";
import type { ReviewListTab } from "~/review/presentation/reviewList/abstractions.js";
import { getReviewListEmpty } from "~/review/presentation/reviewList/getReviewListEmpty.js";
import type { ReviewWidgetKind } from "../abstractions.js";
import type { ReviewWidgetRowVm } from "../abstractions.js";
import type { ReviewWidgetTab } from "../abstractions.js";
import { ReviewWidgetPresenterFeature } from "../feature.js";

export interface ReviewWidgetCardProps {
    kind: ReviewWidgetKind;
    title: string;
    useCases: IReviewListUseCases;
    namespaces: string[];
    rowProvider: IReviewRowProvider;
    viewAllUrl: (tab: ReviewListTab) => string;
}

const SEGMENTS = [
    { label: "Assigned to me", value: "assignedToMe" },
    { label: "Team pool", value: "pool" }
];

const SKELETON_ROWS = [0, 1, 2];

interface ReviewWidgetRowProps {
    row: ReviewWidgetRowVm;
}

const ReviewWidgetRow = ({ row }: ReviewWidgetRowProps) => {
    let title: React.ReactNode = <Text className="font-medium">{row.title}</Text>;
    if (row.contentUrl) {
        title = (
            <Link to={row.contentUrl} variant="secondary">
                {row.title}
            </Link>
        );
    }

    return (
        <li className="flex items-center gap-md px-md py-sm border-b-sm border-solid border-neutral-dimmed">
            <div className="flex-1 min-w-0 flex flex-col gap-xxs">
                {title}
                <Text size="sm" className="text-neutral-strong">
                    {row.stepLine}
                </Text>
            </div>
            <Tag variant={row.stateVariant} content={row.stateLabel} />
            <Text size="sm" className="text-neutral-muted">
                {row.lastChange}
            </Text>
        </li>
    );
};

// The shared card of both widgets: title, optional segment, rows or a state, "View all →".
export const ReviewWidgetCard = createReactiveComponent((props: ReviewWidgetCardProps) => {
    const { kind, title, useCases, namespaces, rowProvider, viewAllUrl } = props;
    const { presenter } = useFeature(ReviewWidgetPresenterFeature);
    const namespacesKey = namespaces.join("|");

    useEffect(() => {
        void presenter.init({ useCases, namespaces, kind, rowProvider });
        return () => {
            presenter.dispose();
        };
    }, [presenter, useCases, rowProvider, namespacesKey, kind]);

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
            <div className="flex flex-col items-center justify-center gap-sm p-xl text-center">
                <Text>Could not load reviews.</Text>
                <Button
                    size="sm"
                    variant="tertiary"
                    text="Try again"
                    onClick={() => presenter.refresh()}
                />
            </div>
        );
    } else if (vm.empty) {
        const empty = getReviewListEmpty(vm.tab ?? "myRequests", false, vm.hasTeams);
        body = (
            <div className="flex flex-col items-center justify-center gap-xs p-xl text-center">
                <Text className="font-semibold">{empty.title}</Text>
                <Text size="sm" className="text-neutral-strong">
                    {empty.description}
                </Text>
            </div>
        );
    } else {
        body = (
            <ul className="list-none m-0 p-0">
                {vm.rows.map(row => (
                    <ReviewWidgetRow key={row.reviewId} row={row} />
                ))}
            </ul>
        );
    }

    const viewAllTab: ReviewListTab = vm.tab ?? "myRequests";

    return (
        <div
            data-testid={`review-widget-${kind}`}
            className="flex flex-col min-h-[300px] rounded-lg bg-neutral-base"
        >
            <div className="flex items-center gap-md px-md py-sm">
                <Text className="flex-1 font-semibold">{title}</Text>
                {segment}
            </div>
            <div className="flex-1 flex flex-col border-t-sm border-solid border-neutral-dimmed">
                {body}
            </div>
            <div className="px-md py-sm text-right">
                <Link to={viewAllUrl(viewAllTab)}>View all →</Link>
            </div>
        </div>
    );
});
