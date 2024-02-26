import React, { lazy, Suspense } from "react";
import Helmet from "react-helmet";
import { SecureRoute } from "@webiny/app-security/components";
import { CircularProgress } from "@webiny/ui/Progress";
import { Route } from "@webiny/react-router";
import { AdminLayout } from "@webiny/app-admin/components/AdminLayout";
import { RoutePlugin } from "@webiny/app/types";
import { i18n } from "@webiny/app/i18n";
import { ContentEntriesContainer } from "~/admin/views/contentEntries/ContentEntriesContainer";
import { ContentEntries } from "~/admin/views/contentEntries/ContentEntries";
import { CompositionScope } from "@webiny/react-composition";

const t = i18n.ns("app-headless-cms/admin/routes");

interface LoaderProps {
    children: React.ReactNode;
}

const Loader = ({ children, ...props }: LoaderProps) => (
    <Suspense fallback={<CircularProgress />}>
        {React.cloneElement(children as unknown as React.ReactElement, props)}
    </Suspense>
);

const ContentModelEditor = lazy(
    () =>
        import(
            /* webpackChunkName: "ViewsContentModelsContentModelEditor" */
            "../views/contentModels/ContentModelEditor"
        )
);
const ContentModelsView = lazy(
    () =>
        import(
            /* webpackChunkName: "ViewsContentModelsContentModels" */
            "../views/contentModels/ContentModels"
        )
);
const ContentModelGroupsView = lazy(
    () =>
        import(
            /* webpackChunkName: "ViewsContentModelsContentModelGroups" */
            "../views/contentModelGroups/ContentModelGroups"
        )
);

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
                            <ContentEntriesContainer>
                                <CompositionScope name={"cms"}>
                                    <ContentEntries />
                                </CompositionScope>
                            </ContentEntriesContainer>
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
                        <CompositionScope name={"cms"}>
                            <Loader>
                                <ContentModelEditor />
                            </Loader>
                        </CompositionScope>
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
