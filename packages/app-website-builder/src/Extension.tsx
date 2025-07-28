import React from "react";
import { AdminConfig } from "@webiny/app-admin";
import { HasPermission } from "@webiny/app-security";
import { ReactComponent as PagesIcon } from "@webiny/icons/table_chart.svg";
import { PageEditor } from "~/modules/pages/PageEditor.js";
import { PageList } from "~/modules/pages/PageList.js";
import { PAGE_EDITOR_ROUTE, PAGE_LIST_ROUTE } from "~/constants.js";
import { useSettingsDialog } from "~/modules/settings/useSettingsDialog";
import { useIntegrationsDialog } from "./modules/integrations/useIntegrationsDialog.js";
import { PagesConfig } from "~/modules/pages/PagesConfig";

const { Menu } = AdminConfig;

export const Extension = () => {
    return (
        <>
            <AdminConfig>
                <HasPermission any={["wb.page"]}>
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
                        element={<Menu.Group text={"Pages"} />}
                    />
                </HasPermission>

                <HasPermission name={"wb.page"}>
                    <AdminConfig.Route
                        name="wb.pages.list"
                        path={PAGE_LIST_ROUTE}
                        element={<PageList />}
                    />
                    <AdminConfig.Route
                        name="wb.pages.editor"
                        path={`${PAGE_EDITOR_ROUTE}/:id`}
                        element={<PageEditor />}
                    />
                    <Menu
                        name="wb.pages"
                        parent={"wb"}
                        element={<Menu.Link text={"Pages"} to={PAGE_LIST_ROUTE} />}
                    />
                </HasPermission>
                <HasPermission name={"wb.settings"}>
                    <Menu name="wb.settings" parent="wb" element={<SettingsMenuItem />} />
                </HasPermission>
                <Menu name="wb.integrations" parent="wb" element={<IntegrationsMenuItem />} />
            </AdminConfig>
            <PagesConfig />
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
