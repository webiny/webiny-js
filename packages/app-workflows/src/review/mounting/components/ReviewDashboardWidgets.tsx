import React from "react";
import { AdminConfig } from "@webiny/app-admin";
import { useRouter } from "@webiny/app-admin";
import type { Route } from "@webiny/app/features/router/Route.js";
import type { IReviewListUseCases } from "~/review/useCases/IReviewListUseCases.js";
import type { IReviewRowProvider } from "~/review/presentation/reviewList/abstractions.js";
import type { ReviewListTab } from "~/review/presentation/reviewList/abstractions.js";
import { ReviewForMeWidget } from "~/review/presentation/reviewWidget/components/ReviewForMeWidget.js";
import { ReviewMyRequestsWidget } from "~/review/presentation/reviewWidget/components/ReviewMyRequestsWidget.js";

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
                column="right"
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
                column="right"
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
