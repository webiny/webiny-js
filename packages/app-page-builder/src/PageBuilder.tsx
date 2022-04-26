import React, { Fragment } from "react";
import { HasPermission } from "@webiny/app-security";
import {
    Compose,
    Plugins,
    AddMenu as Menu,
    Provider,
    HigherOrderComponent
} from "@webiny/app-admin";
import { PageBuilderProvider as ContextProvider } from "./contexts/PageBuilder";
import { ReactComponent as PagesIcon } from "./admin/assets/table_chart-24px.svg";
import { WebsiteSettings } from "./modules/WebsiteSettings/WebsiteSettings";
import { AdminPageBuilderContextProvider } from "~/admin/contexts/AdminPageBuilder";
import { DefaultOnPagePublish } from "~/admin/plugins/pageDetails/pageRevisions/DefaultOnPagePublish";
import { DefaultOnPageDelete } from "~/admin/plugins/pageDetails/pageRevisions/DefaultOnPageDelete";
import { EditorProps, EditorRenderer } from "./admin/components/Editor";

const PageBuilderProviderHOC = (Component: React.FC): React.FC => {
    return function PageBuilderProvider({ children }) {
        return (
            <ContextProvider>
                <AdminPageBuilderContextProvider>
                    <Component>{children}</Component>
                </AdminPageBuilderContextProvider>
            </ContextProvider>
        );
    };
};

const PageBuilderMenu: React.FC = () => {
    return (
        <HasPermission any={["pb.menu", "pb.category", "pb.page"]}>
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
                    <HasPermission name={"pb.menu"}>
                        <Menu
                            name="pageBuilder.pages.menus"
                            label={"Menus"}
                            path="/page-builder/menus"
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
                        <Menu
                            name={"settings.pageBuilder.prerendering"}
                            label={"Prerendering"}
                            path={"/settings/page-builder/prerendering"}
                        />
                    </Menu>
                </Menu>
            </HasPermission>
        </HasPermission>
    );
};

const EditorLoader = React.lazy(() =>
    import("./editor").then(m => ({
        default: m.Editor
    }))
);

const EditorRendererHOC: HigherOrderComponent<EditorProps> = () => {
    return function Editor(props) {
        return <EditorLoader {...props} />;
    };
};
/**
 * TODO @ts-refactor @pavel
 * as any in hoc and provider
 */
export const PageBuilder: React.FC = () => {
    return (
        <Fragment>
            <Provider hoc={PageBuilderProviderHOC} />
            <Compose component={EditorRenderer as any} with={EditorRendererHOC as any} />
            <Plugins>
                <PageBuilderMenu />
                <WebsiteSettings />
                <DefaultOnPagePublish />
                <DefaultOnPageDelete />
            </Plugins>
        </Fragment>
    );
};
