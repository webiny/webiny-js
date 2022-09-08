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

export const PageTemplatesModule = () => {
    const { canCreateContentModels } = usePermission();

    return (
        <Plugins>
            <Menu name={"headlessCMS"}>
                {canCreateContentModels && (
                    <Menu name={"headlessCMS.contentModels"}>
                        {canCreateContentModels && (
                            <Menu
                                name={"headlessCMS.contentModels.pageTemplates"}
                                label={"Page Templates"}
                                path={"/cms/page-templates"}
                            />
                        )}
                    </Menu>
                )}
            </Menu>
            <AddRoute exact path={"/cms/page-templates/:modelId"}>
                <Layout>
                    <Helmet title={"Edit a Page Template"} />
                    <Loader>
                        <PageTemplateEditor />
                    </Loader>
                </Layout>
            </AddRoute>
            <AddRoute exact path={"/cms/page-templates"}>
                <Layout>
                    <Helmet title={"Content Models"} />
                    <Loader>
                        <PageTemplatesList />
                    </Loader>
                </Layout>
            </AddRoute>
        </Plugins>
    );
};
