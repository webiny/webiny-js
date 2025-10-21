import React, { lazy, Suspense } from "react";
import Helmet from "react-helmet";
import { SecureRoute } from "@webiny/app-security/components/index.js";
import { OverlayLoader } from "@webiny/admin-ui";
import { CompositionScope } from "@webiny/react-composition";
import { AdminConfig, AdminLayout } from "@webiny/app-admin";
import { i18n } from "@webiny/app/i18n/index.js";
import { ContentEntriesContainer } from "~/admin/views/contentEntries/ContentEntriesContainer.js";
import { ContentEntries } from "~/admin/views/contentEntries/ContentEntries.js";
import { Routes } from "~/routes.js";
import { CmsMenuLoader } from "~/admin/menus/CmsMenuLoader.js";

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
            /* webpackChunkName: "ViewsContentModelsContentModelEditor" */
            "./views/contentModels/ContentModelEditor.js"
        )
);
const ContentModelsView = lazy(
    () =>
        import(
            /* webpackChunkName: "ViewsContentModelsContentModels" */
            "./views/contentModels/ContentModels.js"
        )
);
const ContentModelGroupsView = lazy(
    () =>
        import(
            /* webpackChunkName: "ViewsContentModelsContentModelGroups" */
            "./views/contentModelGroups/ContentModelGroups.js"
        )
);

const { Route } = AdminConfig;

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
                            <ContentEntriesContainer>
                                <CompositionScope name={"cms"}>
                                    <ContentEntries />
                                </CompositionScope>
                            </ContentEntriesContainer>
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
                            <Loader>
                                <ContentModelsView />
                            </Loader>
                        </AdminLayout>
                    </SecureRoute>
                }
            />

            <CmsMenuLoader />
        </AdminConfig>
    );
};
