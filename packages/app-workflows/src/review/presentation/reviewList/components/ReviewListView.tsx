import React from "react";
import { useEffect } from "react";
import { Alert } from "@webiny/admin-ui";
import { Heading } from "@webiny/admin-ui";
import { Separator } from "@webiny/admin-ui";
import { Skeleton } from "@webiny/admin-ui";
import { ReactComponent as RefreshIcon } from "@webiny/icons/refresh.svg";
import { createReactiveComponent } from "@webiny/app-admin";
import { useFeature } from "@webiny/app";
import type { WorkflowAppKind } from "~/domain/WorkflowAppKind.js";
import type { IReviewContentTypeFilter } from "../IReviewContentTypeFilter.js";
import type { IReviewRowProvider } from "../abstractions.js";
import type { ReviewListRouteParams } from "../abstractions.js";
import type { ReviewListScope } from "~/review/domain/ReviewListScope.js";
import type { ReviewListState } from "~/review/domain/ReviewListState.js";
import { ReviewListPresenterFeature } from "../feature.js";
import { ReviewListDialogs } from "./ReviewListDialogs.js";
import { ReviewListEmpty } from "./ReviewListEmpty.js";
import { ReviewListNotice } from "./ReviewListNotice.js";
import { ReviewListScopeControl } from "./ReviewListScopeControl.js";
import { ReviewListStateControl } from "./ReviewListStateControl.js";
import { ReviewListTable } from "./ReviewListTable.js";
import { ReviewListToolbar } from "./ReviewListToolbar.js";

export interface ReviewListViewProps {
    app: WorkflowAppKind;
    rowProvider: IReviewRowProvider;
    namespaces: string[];
    showContentType: boolean;
    contentTypeFilter: IReviewContentTypeFilter | null;
    // From the route; the presenter falls back to the defaults for a missing or invalid value.
    initialScope?: ReviewListScope | null;
    initialState?: ReviewListState | null;
    /*
     * Writes the scope and state the list shows to the route, after a choice in the controls,
     * "Clear filters" or a fallback of the route's own values. A route change that comes back
     * with the shown values does not reload the list. Without it the list keeps them in memory.
     */
    onRouteChange?: (params: ReviewListRouteParams) => void;
    /*
     * The one content model every request is narrowed to, outside the filters: it is not counted
     * as a filter and "Clear filters" keeps it. Pass it with `showContentType` off, as the column
     * and filter have nothing to show.
     */
    fixedContentTypeId?: string | null;
    // The heading above the search; `null` shows none (the host names the list itself).
    title?: string | null;
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
    const { app, rowProvider, namespaces, showContentType, contentTypeFilter, onRouteChange } =
        props;
    const initialScope = props.initialScope ?? null;
    const initialState = props.initialState ?? null;
    const fixedContentTypeId = props.fixedContentTypeId ?? null;
    const title = props.title === undefined ? "Content Reviews" : props.title;
    const { presenter } = useFeature(ReviewListPresenterFeature);
    const namespacesKey = namespaces.join("|");

    // Writes the shown scope and state to the route when they differ from it.
    const writeRoute = () => {
        if (!onRouteChange) {
            return;
        }
        const { scope, state } = presenter.vm;
        if (scope === initialScope && state === initialState) {
            return;
        }
        onRouteChange({ scope, state });
    };

    // A route that names a scope or state shows the values really applied after a fallback.
    const writeRouteFallback = () => {
        if (initialScope === null && initialState === null) {
            return;
        }
        writeRoute();
    };

    // The route's values are read when the list opens; later route changes go to `applyRoute`.
    useEffect(() => {
        void presenter.init({
            app,
            namespaces,
            rowProvider,
            initialScope,
            initialState,
            showContentType,
            fixedContentTypeId
        });
        return () => {
            presenter.dispose();
        };
    }, [presenter, app, rowProvider, namespacesKey, showContentType, fixedContentTypeId]);

    // A route changed from outside (a link, back or forward) or by `writeRoute`; the presenter
    // ignores the values it already shows, so the search and the content model filter stay. On
    // mount it runs after `init` and only writes a fallback back to the route.
    useEffect(() => {
        void presenter.applyRoute({ scope: initialScope, state: initialState });
        writeRouteFallback();
    }, [presenter, initialScope, initialState]);

    const vm = presenter.vm;

    let heading: React.ReactNode = null;
    if (title !== null) {
        heading = (
            <div className="pt-md px-lg">
                <Heading level={4} as="h1">
                    {title}
                </Heading>
            </div>
        );
    }

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

    let notices: React.ReactNode = null;
    if (notice || loadError) {
        notices = (
            <div className="flex flex-col gap-sm px-lg pt-md">
                {notice}
                {loadError}
            </div>
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
                actionVariant="primary"
                onAction={() => {
                    const pending = presenter.clearFilters();
                    writeRoute();
                    void pending;
                }}
            />
        );
    } else if (vm.rows.length > 0) {
        body = <ReviewListTable presenter={presenter} showContentType={showContentType} />;
    } else {
        body = null;
    }

    return (
        <div>
            {/* The header of the CMS entry list (app-admin ListView.Header), without the title icon. */}
            <div className="flex flex-col gap-md">
                {heading}
                <div className={title === null ? "px-md py-sm" : "px-md pb-sm"}>
                    <ReviewListToolbar
                        presenter={presenter}
                        showContentType={showContentType}
                        contentTypeFilter={contentTypeFilter}
                    />
                </div>
            </div>
            <Separator />
            {/* One filters row under the search: the review state at the start, the scope at the end. */}
            <div
                data-role="review-list-filters"
                className="bg-neutral-subtle px-lg py-sm-plus flex flex-wrap items-center justify-between gap-sm"
            >
                <ReviewListStateControl presenter={presenter} onChanged={writeRoute} />
                <ReviewListScopeControl presenter={presenter} onChanged={writeRoute} />
            </div>
            <Separator />
            {notices}
            {/* The table runs edge to edge with no frame, the same as the CMS entry list. */}
            {body}
            <ReviewListDialogs presenter={presenter} rowProvider={rowProvider} />
        </div>
    );
});
