import React, { Suspense, lazy } from "react";
import Helmet from "react-helmet";
import { SecureRoute } from "@webiny/app-security/components";
import { CircularProgress } from "@webiny/ui/Progress";
import { Route } from "@webiny/react-router";
import { AdminLayout } from "@webiny/app-admin/components/AdminLayout";
import { RoutePlugin } from "@webiny/app/types";
import { i18n } from "@webiny/app/i18n";

const t = i18n.ns("app-headless-cms/admin/routes");

const Loader = ({ children, ...props }) => (
    <Suspense fallback={<CircularProgress />}>{React.cloneElement(children, props)}</Suspense>
);

const ContentModelEditor = lazy(() => import("../views/contentModels/ContentModelEditor"));
const ContentModelsView = lazy(() => import("../views/contentModels/ContentModels"));
const ContentModelGroupsView = lazy(() => import("../views/contentModelGroups/ContentModelGroups"));
const ContentEntiesView = lazy(() => import("../views/contentEntries/ContentEntries"));

const plugins: RoutePlugin[] = [
    {
        name: "route-cms-content-models-groups",
        type: "route",
        route: (
            <Route
                exact
                path={"/cms/content-model-groups"}
                render={() => (
                    <SecureRoute permission={"cms.contentModelGroup"}>
                        <AdminLayout>
                            <Helmet>
                                <title>{t`Content Model Groups`}</title>
                            </Helmet>
                            <Loader>
                                <ContentModelGroupsView />
                            </Loader>
                        </AdminLayout>
                    </SecureRoute>
                )}
            />
        )
    },
    {
        name: "route-cms-content-models-manage",
        type: "route",
        route: (
            <Route
                exact
                path={"/cms/content-entries/:modelId"}
                render={() => (
                    <SecureRoute permission={"cms.contentModel"}>
                        <AdminLayout>
                            <Helmet>
                                <title>{t`Content`}</title>
                            </Helmet>
                            <Loader>
                                <ContentEntiesView />
                            </Loader>
                        </AdminLayout>
                    </SecureRoute>
                )}
            />
        )
    },
    {
        name: "route-cms-content-models-editor",
        type: "route",
        route: (
            <Route
                exact
                path={"/cms/content-models/:modelId"}
                render={() => (
                    <SecureRoute permission={"cms.contentModel"}>
                        <Helmet>
                            <title>{t`Edit Content Model`}</title>
                        </Helmet>
                        <Loader>
                            <ContentModelEditor />
                        </Loader>
                    </SecureRoute>
                )}
            />
        )
    },
    {
        name: "route-cms-content-models",
        type: "route",
        route: (
            <Route
                exact
                path="/cms/content-models"
                render={() => (
                    <SecureRoute permission={"cms.contentModel"}>
                        <AdminLayout>
                            <Helmet title={t`Content Models`} />
                            <Loader>
                                <ContentModelsView />
                            </Loader>
                        </AdminLayout>
                    </SecureRoute>
                )}
            />
        )
    }
];

export default plugins;
