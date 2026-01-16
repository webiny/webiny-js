import React from "react";
import { plugins } from "@webiny/plugins";
import { AdminConfig, useContainer } from "@webiny/app-admin";
import { HasPermission } from "@webiny/app-admin";
import { ReactComponent as PagesIcon } from "@webiny/icons/table_chart.svg";
import { PageEditor } from "~/modules/pages/PageEditor.js";
import { PageList } from "~/modules/pages/PageList.js";
import { useSettingsDialog } from "~/modules/settings/useSettingsDialog.js";
import { useIntegrationsDialog } from "./modules/integrations/useIntegrationsDialog.js";
import { PagesListConfig } from "~/modules/pages/PagesListConfig.js";
import { RedirectsList } from "~/modules/redirects/RedirectsList.js";
import { RedirectsListConfig } from "~/modules/redirects/RedirectsListConfig.js";
import { Routes } from "~/routes.js";
import { useRouter } from "@webiny/app-admin";
import { PagesWidget } from "~/modules/widgets/PagesWidget.js";
import { PageListFeature } from "~/presentation/pages/PageList/feature.js";
import { permissionRenderer } from "~/plugins/permissionRenderer.js";

const { Menu, Route, Dashboard } = AdminConfig;

export const Extension = () => {
    const router = useRouter();
    const container = useContainer();

    plugins.register(permissionRenderer);
    PageListFeature.register(container);

    return (
        <>
            <AdminConfig>
                <HasPermission any={["wb.page", "wb.redirect"]}>
                    <Menu
                        name="wb"
                        element={
                            <Menu.Item
                                text={"Website Builder"}
                                icon={
                                    <Menu.Link.Icon
                                        label={"Website Builder"}
                                        element={<PagesIcon />}
                                    />
                                }
                            />
                        }
                    />
                </HasPermission>

                <HasPermission any={["wb.page"]}>
                    <Menu
                        name="wb.pagesLabel"
                        parent="Wb"
                        element={<Menu.Group text={"Pages"} pinnable={true} />}
                    />
                </HasPermission>

                <HasPermission name={"wb.page"}>
                    <Route route={Routes.Pages.List} element={<PageList />} />
                    <Route route={Routes.Pages.Editor} element={<PageEditor />} />
                    <Menu
                        name="wb.pages"
                        parent={"wb"}
                        element={
                            <Menu.Link
                                text={"Pages"}
                                to={router.getLink(Routes.Pages.List)}
                                pinnable={true}
                            />
                        }
                    />
                    <Dashboard.Widget name="wb.pages" column={"left"} element={<PagesWidget />} />
                </HasPermission>
                <HasPermission name={"wb.redirect"}>
                    <Route route={Routes.Redirects.List} element={<RedirectsList />} />
                    <Menu
                        name="wb.redirects"
                        parent={"wb"}
                        element={
                            <Menu.Link
                                text={"Redirects"}
                                to={router.getLink(Routes.Redirects.List)}
                                pinnable={true}
                            />
                        }
                    />
                </HasPermission>
                <HasPermission name={"wb.page"}>
                    <AdminConfig.Dashboard.Widget
                        name="wb.pages"
                        column="left"
                        element={<PagesWidget />}
                    />
                </HasPermission>
                <HasPermission name={"wb.settings"}>
                    <Menu name="wb.settings" parent="wb" element={<SettingsMenuItem />} />
                </HasPermission>
                <Menu name="wb.integrations" parent="wb" element={<IntegrationsMenuItem />} />
            </AdminConfig>
            <PagesListConfig />
            <RedirectsListConfig />
        </>
    );
};

const SettingsMenuItem = () => {
    const { showSettingsDialog } = useSettingsDialog();
    return <Menu.Item text={"Settings"} onClick={showSettingsDialog} pinnable={true} />;
};

const IntegrationsMenuItem = () => {
    const { showIntegrationsDialog } = useIntegrationsDialog();
    return <Menu.Item text={"Integrations"} onClick={showIntegrationsDialog} pinnable={true} />;
};
