import React, { Fragment } from "react";
import { HasPermission } from "@webiny/app-security";
import { Extensions, AddMenu as Menu, Provider } from "@webiny/app-admin";
import { PageBuilderProvider as ContextProvider } from "./contexts/PageBuilder";
import { ReactComponent as PagesIcon } from "./admin/assets/table_chart-24px.svg";

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
            <Menu id="pageBuilder" label={"Page Builder"} icon={<PagesIcon />}>
                <Menu id="pageBuilder.pages" label={"Pages"}>
                    <HasPermission name={"pb.category"}>
                        <Menu
                            id="pageBuilder.pages.categories"
                            label={"Categories"}
                            path="/page-builder/categories"
                        />
                    </HasPermission>
                    <HasPermission name={"pb.page"}>
                        <Menu
                            id="pageBuilder.pages.pages"
                            label={"Pages"}
                            path="/page-builder/pages"
                        />
                    </HasPermission>
                    <HasPermission name={"pb.menu"}>
                        <Menu
                            id="pageBuilder.pages.menus"
                            label={"Menus"}
                            path="/page-builder/menus"
                        />
                    </HasPermission>
                </Menu>
            </Menu>
            <HasPermission name={"pb.settings"}>
                <Menu id={"settings"}>
                    <Menu id={"settings.pageBuilder"} label={"Page Builder"}>
                        <Menu
                            id={"settings.pageBuilder.website"}
                            label={"Website"}
                            path={"/settings/page-builder/website"}
                        />
                        <Menu
                            id={"settings.pageBuilder.prerendering"}
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
            <Extensions>
                <PageBuilderMenu />
            </Extensions>
        </Fragment>
    );
};
