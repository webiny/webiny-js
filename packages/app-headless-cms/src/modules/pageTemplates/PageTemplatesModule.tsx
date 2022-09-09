import React, { Suspense, lazy } from "react";
import { Helmet } from "react-helmet";
import { AddMenu as Menu, AddRoute, Plugins, Layout } from "@webiny/app-admin";
import { usePermission } from "~/admin/hooks";
import { CircularProgress } from "@webiny/ui/Progress";

const Loader: React.FC = ({ children, ...props }) => (
    <Suspense fallback={<CircularProgress />}>
        {React.cloneElement(children as unknown as JSX.Element, props)}
    </Suspense>
);

const PageTemplateEditor = lazy(() => import("./views/editor/PageTemplateEditor"));
const PageTemplatesList = lazy(() => import("./views/list/ContentModels"));

const MenusAndRoutes = () => {
    const { canReadContentModels } = usePermission();

    return (
        <>
            <Menu name={"headlessCMS"}>
                {canReadContentModels && (
                    <Menu name={"headlessCMS.contentModels"}>
                        <Menu
                            name={"headlessCMS.contentModels.pageTemplates"}
                            label={"Page Templates"}
                            path={"/cms/page-templates"}
                        />
                    </Menu>
                )}
            </Menu>
            <AddRoute exact path={"/cms/page-templates/:modelId"}>
                <>
                    <Helmet title={"Edit a Page Template"} />
                    <Loader>
                        <PageTemplateEditor />
                    </Loader>
                </>
            </AddRoute>
            <AddRoute exact path={"/cms/page-templates"}>
                <Layout>
                    <Helmet title={"Page Templates"} />
                    <Loader>
                        <PageTemplatesList />
                    </Loader>
                </Layout>
            </AddRoute>
        </>
    );
};

export const PageTemplatesModule = () => {
    return (
        <Plugins>
            <MenusAndRoutes />
        </Plugins>
    );
};
