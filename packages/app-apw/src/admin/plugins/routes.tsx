import React from "react";
import Helmet from "react-helmet";
import { Route } from "@webiny/react-router";
import { AdminLayout } from "@webiny/app-admin/components/AdminLayout";
import { SecureRoute } from "@webiny/app-security/components";
import { RoutePlugin } from "@webiny/app/plugins/RoutePlugin";
import { PublishingWorkflowsView } from "../views/publishingWorkflows";

export default new RoutePlugin({
    route: (
        <Route
            exact
            path={"/apw/publishing-workflows"}
            render={() => (
                <SecureRoute permission={"apw"}>
                    <AdminLayout>
                        <Helmet title={"APW - Publishing workflows"} />
                        <PublishingWorkflowsView />
                    </AdminLayout>
                </SecureRoute>
            )}
        />
    )
});
