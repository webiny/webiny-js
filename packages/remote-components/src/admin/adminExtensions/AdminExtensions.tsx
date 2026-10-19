import React from "react";
import { AdminConfig } from "@webiny/app-admin";
import { AdminLayout } from "@webiny/app-admin";
import { RegisterFeature } from "@webiny/app-admin";
import { useRouter } from "@webiny/app-admin";
import { ReactComponent as ExtensionIcon } from "@webiny/icons/extension.svg";
import { AdminExtensionsGatewayFeature } from "./features/gateway/feature.js";
import { AdminExtensionPermissionsFeature } from "./features/permissions/feature.js";
import { EnabledExtensionsFeature } from "./presentation/EnabledExtensions/feature.js";
import { FieldRendererRuntimeFeature } from "./features/fieldRendererRuntime/feature.js";
import { GeneratedCmsFieldRenderersFeature } from "./features/cmsFieldRenderers/feature.js";
import { AdminExtensionListFeature } from "./presentation/AdminExtensionList/feature.js";
import { EnabledExtensions } from "./presentation/EnabledExtensions/EnabledExtensions.js";
import { AdminExtensionListPage } from "./presentation/AdminExtensionList/components/AdminExtensionListPage.js";
import { HasPermission } from "./presentation/security/HasPermission.js";
import { AdminExtensionRoutes } from "./routes.js";
import { ADMIN_EXTENSION_PERMISSIONS_SCHEMA } from "./permissions.js";

const { Menu, Route, Security } = AdminConfig;

/** Loads stored admin extensions into the admin, and the screen that manages them. */
export const AdminExtensions = () => {
    const { getLink } = useRouter();

    return (
        <>
            <RegisterFeature feature={AdminExtensionsGatewayFeature} />
            <RegisterFeature feature={AdminExtensionPermissionsFeature} />
            <RegisterFeature feature={FieldRendererRuntimeFeature} />
            <RegisterFeature feature={GeneratedCmsFieldRenderersFeature} />
            <RegisterFeature feature={EnabledExtensionsFeature} />
            <RegisterFeature feature={AdminExtensionListFeature} />

            <EnabledExtensions />

            <AdminConfig>
                <HasPermission entity="adminExtension">
                    <Route
                        route={AdminExtensionRoutes.List}
                        element={
                            <AdminLayout title="Admin extensions">
                                <AdminConfig.Breadcrumb
                                    name="adminExtensions"
                                    label="Admin extensions"
                                />
                                <AdminExtensionListPage />
                            </AdminLayout>
                        }
                    />
                    <Menu
                        name="adminExtensions"
                        parent="settings.system"
                        element={
                            <Menu.Link
                                text="Admin extensions"
                                to={getLink(AdminExtensionRoutes.List)}
                            />
                        }
                    />
                </HasPermission>
                <Security.Permissions
                    name="adminExtensions"
                    title="Admin extensions"
                    description="Manage menu items, field renderers and other admin changes made by the assistant."
                    icon={<ExtensionIcon />}
                    schema={ADMIN_EXTENSION_PERMISSIONS_SCHEMA}
                />
            </AdminConfig>
        </>
    );
};
