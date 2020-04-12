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

const ContentModelEditor = lazy(() => import("../views/Editor"));
const ContentModelsView = lazy(() => import("../views/ContentModels/ContentModels"));
const ContentModelGroupsView = lazy(() => import("../views/ContentModelGroups/ContentModelGroups"));
const EnvironmentsView = lazy(() => import("../views/Environments/Environments"));
const EnvironmentAliasesView = lazy(() => import("../views/EnvironmentAliases/EnvironmentAliases"));
const ContentView = lazy(() => import("../views/Content/Content"));

const plugins: RoutePlugin[] = [
    {
        name: "route-cms-content-models-groups",
        type: "route",
        route: (
            <Route
                exact
                path={"/cms/content-model-groups"}
                render={() => (
                    <SecureRoute roles={["cms-content-model-groups"]}>
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
                path={"/cms/content-models/manage/:modelId"}
                render={() => (
                    <SecureRoute roles={["headless-cms-content-models"]}>
                        <AdminLayout>
                            <Helmet>
                                <title>{t`Content`}</title>
                            </Helmet>
                            <Loader>
                                <ContentView />
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
                path={"/cms/content-models/:id"}
                render={() => (
                    <SecureRoute roles={["headless-cms-content-models"]}>
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
                    <SecureRoute roles={["headless-cms-content-models"]}>
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
    },

    {
        type: "route",
        name: "route-settings-cms-environments",
        route: (
            <Route
                exact
                path="/settings/cms/environments"
                render={() => (
                    <SecureRoute roles={["headless-cms-environments"]}>
                        <AdminLayout>
                            <Helmet title={t`Headless CMS - Environments Settings`} />
                            <Loader>
                                <EnvironmentsView />
                            </Loader>
                        </AdminLayout>
                    </SecureRoute>
                )}
            />
        )
    },
    {
        type: "route",
        name: "route-settings-cms-environment-aliases",
        route: (
            <Route
                exact
                path="/settings/cms/environments/aliases"
                render={() => (
                    <SecureRoute roles={["headless-cms-environment-aliases"]}>
                        <AdminLayout>
                            <Helmet title={t`Headless CMS - Environment Aliases Settings`} />
                            <Loader>
                                <EnvironmentAliasesView />
                            </Loader>
                        </AdminLayout>
                    </SecureRoute>
                )}
            />
        )
    }
];

export default plugins;
