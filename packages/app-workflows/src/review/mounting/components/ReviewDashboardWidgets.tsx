import React from "react";
import { AdminConfig } from "@webiny/app-admin";
import { useRouter } from "@webiny/app-admin";
import type { Route } from "@webiny/app/features/router/Route.js";
import type { IReviewListUseCases } from "~/review/useCases/IReviewListUseCases.js";
import type { IReviewRowProvider } from "~/review/presentation/reviewList/abstractions.js";
import type { ReviewListTab } from "~/review/presentation/reviewList/abstractions.js";
import { ReviewForMeWidget } from "~/review/presentation/reviewWidget/components/ReviewForMeWidget.js";
import { ReviewMyRequestsWidget } from "~/review/presentation/reviewWidget/components/ReviewMyRequestsWidget.js";
import { ReviewWidgetPreview } from "~/review/presentation/reviewWidget/components/ReviewWidgetPreview.js";
import type { ReviewWidgetRowVm } from "~/review/presentation/reviewWidget/abstractions.js";

export interface ReviewDashboardWidgetsProps {
    prefix: "cms" | "wb";
    useCases: IReviewListUseCases;
    namespaces: string[];
    rowProvider: IReviewRowProvider;
    viewAllRoute: Route<any>;
    /*
     * `false` while the app still loads its namespaces: no widget is registered yet, so none starts
     * twice.
     */
    ready?: boolean;
}

// The heading the widgets are listed under in the dashboard "Add widget" drawer.
const GROUPS = {
    cms: "Headless CMS",
    wb: "Website Builder"
};

// Sample rows for the "Add widget" drawer previews; the previews load nothing.
const FOR_ME_PREVIEW_ROWS: ReviewWidgetRowVm[] = [
    {
        reviewId: "preview-1",
        title: "Spring product launch",
        stepLine: "Legal review",
        stateLabel: "In review",
        stateVariant: "accent-light",
        lastChange: "2 hours ago",
        contentUrl: null
    },
    {
        reviewId: "preview-2",
        title: "Pricing page update",
        stepLine: "Editorial review",
        stateLabel: "In review",
        stateVariant: "accent-light",
        lastChange: "Yesterday",
        contentUrl: null
    }
];

const MY_REQUESTS_PREVIEW_ROWS: ReviewWidgetRowVm[] = [
    {
        reviewId: "preview-3",
        title: "Customer story: Acme",
        stepLine: "Editorial review",
        stateLabel: "In review",
        stateVariant: "accent-light",
        lastChange: "3 hours ago",
        contentUrl: null
    },
    {
        reviewId: "preview-4",
        title: "Q3 newsletter",
        stepLine: "Final approval",
        stateLabel: "Approved",
        stateVariant: "success-light",
        lastChange: "2 days ago",
        contentUrl: null
    }
];

// The two dashboard widgets of one app (R231): For me to review, and My requests.
export const ReviewDashboardWidgets = (props: ReviewDashboardWidgetsProps) => {
    const { prefix, useCases, namespaces, rowProvider, viewAllRoute } = props;
    const router = useRouter();
    const { Widget } = AdminConfig.Dashboard;

    if (props.ready === false) {
        return null;
    }

    const viewAllUrl = (tab: ReviewListTab): string => {
        return router.getLink(viewAllRoute, { tab });
    };

    return (
        <AdminConfig>
            <Widget
                name={`workflows.${prefix}.review`}
                title="For me to review"
                description="Reviews waiting on you or your teams."
                group={GROUPS[prefix]}
                column="right"
                preview={
                    <ReviewWidgetPreview
                        title="For me to review"
                        showSegment={true}
                        rows={FOR_ME_PREVIEW_ROWS}
                    />
                }
                element={
                    <ReviewForMeWidget
                        useCases={useCases}
                        namespaces={namespaces}
                        rowProvider={rowProvider}
                        viewAllUrl={viewAllUrl}
                    />
                }
            />
            <Widget
                name={`workflows.${prefix}.requested`}
                title="My requests"
                description="Reviews you requested."
                group={GROUPS[prefix]}
                column="right"
                preview={
                    <ReviewWidgetPreview
                        title="My requests"
                        showSegment={false}
                        rows={MY_REQUESTS_PREVIEW_ROWS}
                    />
                }
                element={
                    <ReviewMyRequestsWidget
                        useCases={useCases}
                        namespaces={namespaces}
                        rowProvider={rowProvider}
                        viewAllUrl={viewAllUrl}
                    />
                }
            />
        </AdminConfig>
    );
};
