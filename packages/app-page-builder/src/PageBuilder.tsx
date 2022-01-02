import React, { Fragment } from "react";
import { HasPermission } from "@webiny/app-security";
import { Plugins, AddMenu as Menu, Provider } from "@webiny/app-admin";
import { PageBuilderProvider as ContextProvider } from "./contexts/PageBuilder";
import { ReactComponent as PagesIcon } from "./admin/assets/table_chart-24px.svg";
import { WebsiteSettings } from "./modules/WebsiteSettings/WebsiteSettings";

const PageBuilderProviderHOC = Component => {
    return function PageBuilderProvider({ children }) {
        return (
            <ContextProvider>
                <Component>{children}</Component>
            </ContextProvider>
        );
    };
};

const PageBuilderMenu = () => {
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

export const PageBuilder = () => {
    return (
        <Fragment>
            <Provider hoc={PageBuilderProviderHOC} />
            <Plugins>
                <PageBuilderMenu />
                <WebsiteSettings />
            </Plugins>
        </Fragment>
    );
};
