import React from "react";
import { AdminConfig } from "@webiny/app-admin";
import { HasPermission } from "@webiny/app-security";
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

const { Menu, Route } = AdminConfig;

export const Extension = () => {
    const router = useRouter();

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
                        pinnable={true}
                        element={<Menu.Group text={"Pages"} />}
                    />
                </HasPermission>

                <HasPermission name={"wb.page"}>
                    <Route route={Routes.Pages.List} element={<PageList />} />
                    <Route route={Routes.Pages.Editor} element={<PageEditor />} />
                    <Menu
                        name="wb.pages"
                        parent={"wb"}
                        pinnable={true}
                        element={
                            <Menu.Link text={"Pages"} to={router.getLink(Routes.Pages.List)} />
                        }
                    />
                </HasPermission>
                <HasPermission name={"wb.redirect"}>
                    <Route route={Routes.Redirects.List} element={<RedirectsList />} />
                    <Menu
                        name="wb.redirects"
                        parent={"wb"}
                        pinnable={true}
                        element={
                            <Menu.Link
                                text={"Redirects"}
                                to={router.getLink(Routes.Redirects.List)}
                            />
                        }
                    />
                </HasPermission>
                <HasPermission name={"wb.settings"}>
                    <Menu
                        name="wb.settings"
                        parent="wb"
                        pinnable={true}
                        element={<SettingsMenuItem />}
                    />
                </HasPermission>
                <Menu
                    name="wb.integrations"
                    parent="wb"
                    pinnable={true}
                    element={<IntegrationsMenuItem />}
                />
            </AdminConfig>
            <PagesListConfig />
            <RedirectsListConfig />
        </>
    );
};

const SettingsMenuItem = () => {
    const { showSettingsDialog } = useSettingsDialog();
    return <Menu.Item text={"Settings"} onClick={showSettingsDialog} />;
};

const IntegrationsMenuItem = () => {
    const { showIntegrationsDialog } = useIntegrationsDialog();
    return <Menu.Item text={"Integrations"} onClick={showIntegrationsDialog} />;
};
