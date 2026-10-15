import React from "react";
import { WorkflowsMenu } from "./workflowStateList/components/WorkflowsMenu.js";
import { AdminConfig, AdminLayout } from "@webiny/app-admin";
import Helmet from "react-helmet";
import { Routes } from "~/routes.js";
import { WorkflowStateListView } from "~/presentation/workflowStateList/components/List/WorkflowStateListView.js";
import { WorkflowStatesOwnWidget } from "~/presentation/workflowStatesWidget/components/WorkflowStatesOwnWidget.js";
import { WorkflowStatesRequestedWidget } from "~/presentation/workflowStatesWidget/components/WorkflowStatesRequestedWidget.js";
import { ContentReviewsWidgetPreview } from "~/presentation/workflowStatesWidget/components/ContentReviewsWidgetPreview.js";
import type { ContentReviewsWidgetPreviewRow } from "~/presentation/workflowStatesWidget/components/ContentReviewsWidgetPreview.js";

const { Route } = AdminConfig;

// Sample entries for the "Add widget" drawer previews.
const REQUESTED_PREVIEW_ROWS: ContentReviewsWidgetPreviewRow[] = [
    {
        title: "Spring product launch",
        description: "Legal review - Jane Doe, 2 hours ago",
        color: "#E28743"
    },
    {
        title: "Pricing page update",
        description: "Editorial review - John Smith, yesterday",
        color: "#4A90E2"
    }
];

const OWN_PREVIEW_ROWS: ContentReviewsWidgetPreviewRow[] = [
    {
        title: "Customer story: Acme",
        description: "Editorial review - Ana Lee, 3 hours ago",
        color: "#4A90E2"
    },
    {
        title: "Q3 newsletter",
        description: "Final approval - Mark Ross, 2 days ago",
        color: "#7B61FF"
    }
];

export const ContentReviews = () => {
    return (
        <AdminConfig>
            <Route
                route={Routes.Workflows.ContentReviews}
                element={
                    <AdminLayout>
                        <Helmet>
                            <title>{`Content Reviews`}</title>
                        </Helmet>
                        <AdminConfig.Breadcrumb
                            name={"content-reviews"}
                            label={"Content Reviews"}
                        />
                        <WorkflowStateListView />
                    </AdminLayout>
                }
            />
            <WorkflowsMenu />

            <AdminConfig.Dashboard.Widget
                name="workflows.requested"
                title="Content Reviews assigned to me"
                description="Entries waiting on your approval."
                group="Workflows"
                column="right"
                element={<WorkflowStatesRequestedWidget />}
                preview={
                    <ContentReviewsWidgetPreview
                        title={
                            <span>
                                <span className={"text-accent-primary"}>Content Reviews</span>{" "}
                                assigned to me
                            </span>
                        }
                        rows={REQUESTED_PREVIEW_ROWS}
                    />
                }
            />
            <AdminConfig.Dashboard.Widget
                name="workflows.own"
                title="Content Reviews assigned by me"
                description="Entries you sent for review."
                group="Workflows"
                column="right"
                element={<WorkflowStatesOwnWidget />}
                preview={
                    <ContentReviewsWidgetPreview
                        title={
                            <span>
                                <span className={"text-accent-primary"}>Content Reviews</span>{" "}
                                assigned by me
                            </span>
                        }
                        rows={OWN_PREVIEW_ROWS}
                    />
                }
            />
        </AdminConfig>
    );
};
