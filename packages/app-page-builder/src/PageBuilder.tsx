import React, { Fragment } from "react";
import { HasPermission } from "@webiny/app-security";
import {
    Plugins,
    AddMenu as Menu,
    createProviderPlugin,
    createComponentPlugin
} from "@webiny/app-admin";
import { PageBuilderProvider as ContextProvider } from "./contexts/PageBuilder";
import { ReactComponent as PagesIcon } from "./admin/assets/table_chart-24px.svg";
import { WebsiteSettings } from "./modules/WebsiteSettings/WebsiteSettings";
import { AdminPageBuilderContextProvider } from "~/admin/contexts/AdminPageBuilder";
import { DefaultOnPagePublish } from "~/admin/plugins/pageDetails/pageRevisions/DefaultOnPagePublish";
import { DefaultOnPageDelete } from "~/admin/plugins/pageDetails/pageRevisions/DefaultOnPageDelete";
import { EditorProps, EditorRenderer } from "./admin/components/Editor";

export type { EditorProps };
export { EditorRenderer };

const PageBuilderProviderPlugin = createProviderPlugin(Component => {
    return function PageBuilderProvider({ children }) {
        return (
            <ContextProvider>
                <AdminPageBuilderContextProvider>
                    <Component>{children}</Component>
                </AdminPageBuilderContextProvider>
            </ContextProvider>
        );
    };
});

const PageBuilderMenu: React.FC = () => {
    return (
        <HasPermission any={["pb.menu", "pb.category", "pb.page", "pb.template", "pb.block"]}>
            <Menu name="pageBuilder" label={"Page Builder"} icon={<PagesIcon />}>
                <Menu name="pageBuilder.pages" label={"Pages"}>
                    <HasPermission name={"pb.category"}>
                        <Menu
                            name="pageBuilder.pages.categories"
                            label={"Categories"}
                            path="/page-builder/categories"
                        />
                    </HasPermission>
                    <HasPermission name={"pb.page"}>
                        <Menu
                            name="pageBuilder.pages.pages"
                            label={"Pages"}
                            path="/page-builder/pages"
                        />
                    </HasPermission>
                    <HasPermission name={"pb.template"}>
                        <Menu
                            name="pageBuilder.pages.pageTemplates"
                            label={"Templates"}
                            path="/page-builder/page-templates"
                        />
                    </HasPermission>
                    <HasPermission name={"pb.menu"}>
                        <Menu
                            name="pageBuilder.pages.menus"
                            label={"Menus"}
                            path="/page-builder/menus"
                        />
                    </HasPermission>
                </Menu>
                <Menu name="pageBuilder.blocks" label={"Blocks"}>
                    <HasPermission name={"pb.block"}>
                        <Menu
                            name="pageBuilder.blocks.categories"
                            label={"Categories"}
                            path="/page-builder/block-categories"
                        />
                        <Menu
                            name="pageBuilder.blocks.pageBlocks"
                            label={"Blocks"}
                            path="/page-builder/page-blocks"
                        />
                    </HasPermission>
                </Menu>
            </Menu>
            <HasPermission name={"pb.settings"}>
                <Menu name={"settings"}>
                    <Menu name={"settings.pageBuilder"} label={"Page Builder"}>
                        <Menu
                            name={"settings.pageBuilder.website"}
                            label={"Website"}
                            path={"/settings/page-builder/website"}
                        />
                    </Menu>
                </Menu>
            </HasPermission>
        </HasPermission>
    );
};

const EditorLoader = React.lazy(() =>
    import("./editor/Editor").then(m => ({
        default: m.Editor
    }))
);

const EditorRendererPlugin = createComponentPlugin(EditorRenderer, () => {
    return function Editor(props) {
        return <EditorLoader {...props} />;
    };
});

export const PageBuilder: React.FC = () => {
    return (
        <Fragment>
            <PageBuilderProviderPlugin />
            <EditorRendererPlugin />
            <Plugins>
                <PageBuilderMenu />
                <WebsiteSettings />
                <DefaultOnPagePublish />
                <DefaultOnPageDelete />
            </Plugins>
        </Fragment>
    );
};
