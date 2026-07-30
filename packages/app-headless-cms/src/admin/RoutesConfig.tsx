import React, { lazy, Suspense } from "react";
import Helmet from "react-helmet";
import { SecureRoute, HasPermission } from "@webiny/app-admin";
import { OverlayLoader } from "@webiny/admin-ui";
import { CompositionScope } from "@webiny/react-composition";
import { AdminConfig, AdminLayout } from "@webiny/app-admin";
import { i18n } from "@webiny/app/i18n/index.js";
import { ContentEntriesRouteAdapter } from "~/presentation/contentEntries/views/ContentEntriesRouteAdapter.js";
import { Routes } from "~/routes.js";
import { CmsMenuLoader } from "~/presentation/menus/CmsMenuLoader.js";
import { ContentModelsWidget } from "~/admin/components/ContentModelsWidget.js";

const t = i18n.ns("app-headless-cms/admin/routes");

interface LoaderProps {
    children: React.ReactNode;
}

const Loader = ({ children, ...props }: LoaderProps) => (
    <Suspense fallback={<OverlayLoader />}>
        {React.cloneElement(children as unknown as React.ReactElement, props)}
    </Suspense>
);

const ContentModelEditor = lazy(
    () =>
        import(
            /* webpackChunkName: "content-model-editor" */
            "./views/contentModels/ContentModelEditor.js"
        )
);
const ContentModelsView = lazy(
    () =>
        import(
            /* webpackChunkName: "content-models" */
            "../presentation/contentModels/components/ContentModels.js"
        )
);
const ContentModelGroupsView = lazy(
    () =>
        import(
            /* webpackChunkName: "content-model-groups" */
            "../presentation/modelGroup/components/ContentModelGroups.js"
        )
);

const { Route } = AdminConfig;

// Shared leading breadcrumb for the CMS list routes.
const CmsRoot = () => (
    <AdminConfig.Breadcrumb
        name={"cms"}
        label={"Headless CMS"}
        to={{ route: Routes.ContentModels.List }}
    />
);

export const RoutesConfig = () => {
    return (
        <AdminConfig>
            <Route
                route={Routes.ContentModelGroups.List}
                element={
                    <SecureRoute permission={"cms.contentModelGroup"}>
                        <AdminLayout>
                            <Helmet>
                                <title>{t`Content Model Groups`}</title>
                            </Helmet>
                            <CmsRoot />
                            <AdminConfig.Breadcrumb name={"cms.groups"} label={"Model Groups"} />
                            <Loader>
                                <ContentModelGroupsView />
                            </Loader>
                        </AdminLayout>
                    </SecureRoute>
                }
            />
            <Route
                route={Routes.ContentEntries.List}
                element={
                    <SecureRoute permission={"cms.contentModel"}>
                        <AdminLayout>
                            <Helmet>
                                <title>{t`Content`}</title>
                            </Helmet>
                            {/* Breadcrumbs (Headless CMS › Model › folder path) are emitted
                                dynamically from within the entries view. */}
                            <CompositionScope name={"cms"}>
                                <ContentEntriesRouteAdapter />
                            </CompositionScope>
                        </AdminLayout>
                    </SecureRoute>
                }
            />
            <Route
                route={Routes.ContentModels.Editor}
                element={
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
                }
            />
            <Route
                route={Routes.ContentModels.List}
                element={
                    <SecureRoute permission={"cms.contentModel"}>
                        <AdminLayout>
                            <Helmet title={t`Content Models`} />
                            <CmsRoot />
                            <AdminConfig.Breadcrumb name={"cms.models"} label={"Models"} />
                            <Loader>
                                <ContentModelsView />
                            </Loader>
                        </AdminLayout>
                    </SecureRoute>
                }
            />

            <CmsMenuLoader />

            <HasPermission name={"cms.contentModel"}>
                <AdminConfig.Dashboard.Widget
                    name="cms.contentModels"
                    column="left"
                    element={<ContentModelsWidget />}
                />
            </HasPermission>
        </AdminConfig>
    );
};
