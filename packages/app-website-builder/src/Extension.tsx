import React, { useEffect } from "react";
import { AdminConfig, RegisterFeature, useContainer, useRouter } from "@webiny/app-admin";
import {
    ReactComponent as PagesIcon,
    ReactComponent as PermissionsIcon
} from "@webiny/icons/table_chart.svg";
import { PageEditor } from "~/modules/pages/PageEditor.js";
import { PageList } from "~/modules/pages/PageList.js";
import { useSettingsDialog } from "~/modules/settings/useSettingsDialog.js";
import { useIntegrationsDialog } from "./modules/integrations/useIntegrationsDialog.js";
import { PagesListConfig } from "~/modules/pages/PagesListConfig.js";
import { RedirectsList } from "~/presentation/redirects/RedirectList/components/RedirectsList.js";
import { RedirectsListConfig } from "~/presentation/redirects/RedirectList/components/RedirectsListConfig.js";
import { Routes } from "~/routes.js";
import { PagesWidget } from "~/modules/widgets/PagesWidget.js";
import { PageListFeature } from "~/presentation/pages/PageList/feature.js";
import { Extension as NavigationExtension } from "./presentation/navigation/Extension.js";
import { NextjsConfigFeature } from "~/presentation/navigation/NextjsConfig/feature.js";
import { WB_PERMISSIONS_SCHEMA } from "~/constants.js";
import { WbPermissionsFeature } from "~/features/permissions/feature.js";
import { HasPermission } from "~/presentation/security/HasPermission.js";
import { TranslatePageFeature } from "~/features/pages/translatePage/index.js";
import { DeletePageFeature } from "~/features/pages/deletePage/index.js";
import { MovePageFeature } from "~/features/pages/movePage/index.js";
import { PublishPageFeature } from "~/features/pages/publishPage/index.js";
import { UnpublishPageFeature } from "~/features/pages/unpublishPage/index.js";
import { DuplicatePageFeature } from "~/features/pages/duplicatePage/index.js";
import { CreatePageRevisionFromFeature } from "~/features/pages/createPageRevisionFrom/index.js";
import { UpdatePageFeature } from "~/features/pages/updatePage/index.js";
import { UpdatePageRevisionDescriptionFeature } from "~/features/pages/updatePageRevisionDescription/index.js";
import { CreatePageFeature as CreatePageHeadlessFeature } from "~/features/pages/createPage/index.js";
import { GetPageFeature } from "~/features/pages/getPage/index.js";
import { GetPageRevisionsFeature } from "~/features/pages/getPageRevisions/index.js";
import { SelectPagesFeature } from "~/features/pages/selectPages/index.js";
import { SharedPageInfrastructureFeature } from "~/features/pages/shared/feature.js";
import { LoadPagesFeature } from "~/features/pages/loadPages/index.js";
import { CreatePageConfig } from "./presentation/pages/CreatePage/CreatePageConfig.js";
import { TranslatePageConfig } from "./presentation/pages/TranslatePage/TranslatePageConfig.js";
import { CreatePageFeature } from "~/presentation/pages/CreatePage/feature.js";
import { PageSettingsFeature } from "~/modules/pages/PageEditor/PageSettings/feature.js";
import { DeletePageRevisionFeature } from "~/features/pages/deletePageRevision/index.js";

const { Security, Menu, Route, Dashboard } = AdminConfig;

export const Extension = () => {
    const router = useRouter();
    const container = useContainer();

    useEffect(() => {
        PageListFeature.register(container);
    }, []);

    return (
        <>
            <RegisterFeature feature={SharedPageInfrastructureFeature} />
            <RegisterFeature feature={NextjsConfigFeature} />
            <RegisterFeature feature={WbPermissionsFeature} />
            <RegisterFeature feature={TranslatePageFeature} />
            <RegisterFeature feature={DeletePageFeature} />
            <RegisterFeature feature={DeletePageRevisionFeature} />
            <RegisterFeature feature={MovePageFeature} />
            <RegisterFeature feature={PublishPageFeature} />
            <RegisterFeature feature={UnpublishPageFeature} />
            <RegisterFeature feature={DuplicatePageFeature} />
            <RegisterFeature feature={CreatePageRevisionFromFeature} />
            <RegisterFeature feature={UpdatePageFeature} />
            <RegisterFeature feature={UpdatePageRevisionDescriptionFeature} />
            <RegisterFeature feature={CreatePageHeadlessFeature} />
            <RegisterFeature feature={GetPageFeature} />
            <RegisterFeature feature={GetPageRevisionsFeature} />
            <RegisterFeature feature={SelectPagesFeature} />
            <RegisterFeature feature={LoadPagesFeature} />
            <RegisterFeature feature={CreatePageFeature} />
            <RegisterFeature feature={PageSettingsFeature} />
            <AdminConfig>
                <Security.Permissions
                    name="website-builder"
                    title="Website Builder"
                    description="Manage Website Builder permissions."
                    icon={<PermissionsIcon />}
                    schema={WB_PERMISSIONS_SCHEMA}
                />
                <HasPermission any={["page", "redirect"]}>
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

                <HasPermission entity={"page"}>
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
                    <NavigationExtension />
                </HasPermission>

                <HasPermission entity={"redirect"}>
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
                <HasPermission entity={"settings"}>
                    <Menu name="wb.settings" parent="wb" element={<SettingsMenuItem />} />
                </HasPermission>
                <HasPermission entity={"integrations"}>
                    <Menu name="wb.integrations" parent="wb" element={<IntegrationsMenuItem />} />
                </HasPermission>
            </AdminConfig>
            <PagesListConfig />
            <RedirectsListConfig />
            <CreatePageConfig />
            <TranslatePageConfig />
        </>
    );
};

Extension.displayName = "WbExtension";

const SettingsMenuItem = () => {
    const { showSettingsDialog } = useSettingsDialog();
    return <Menu.Item text={"Settings"} onClick={showSettingsDialog} pinnable={true} />;
};

const IntegrationsMenuItem = () => {
    const { showIntegrationsDialog } = useIntegrationsDialog();
    return <Menu.Item text={"Integrations"} onClick={showIntegrationsDialog} pinnable={true} />;
};
