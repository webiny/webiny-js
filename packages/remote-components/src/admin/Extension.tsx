import React from "react";
import { AdminConfig, AdminLayout, RegisterFeature, useRouter } from "@webiny/app-admin";
import { ReactComponent as ComponentIcon } from "@webiny/icons/extension.svg";
import { RemoteComponentGatewayFeature } from "./features/shared/feature.js";
import { ComponentListFeature } from "./presentation/ComponentList/feature.js";
import { ComponentEditorFeature } from "./presentation/ComponentEditor/feature.js";
import { CreateComponentFeature } from "./presentation/CreateComponent/feature.js";
import { ComponentListPage } from "./presentation/ComponentList/components/ComponentListPage.js";
import { ComponentEditorPage } from "./presentation/ComponentEditor/components/ComponentEditorPage.js";
import {
    CREATE_COMPONENT_DIALOG,
    CreateComponentDialogContent
} from "./presentation/CreateComponent/components/CreateComponentDialog.js";
import { Routes } from "./routes.js";

const { Menu, Route, Dialog } = AdminConfig;

export const Extension = () => {
    const { getLink } = useRouter();

    return (
        <>
            <RegisterFeature feature={RemoteComponentGatewayFeature} />
            <RegisterFeature feature={ComponentListFeature} />
            <RegisterFeature feature={ComponentEditorFeature} />
            <RegisterFeature feature={CreateComponentFeature} />

            <AdminConfig>
                <Route
                    route={Routes.List}
                    element={
                        <AdminLayout title="Remote Components">
                            <ComponentListPage />
                        </AdminLayout>
                    }
                />
                <Route
                    route={Routes.Editor}
                    element={
                        <AdminLayout title="Edit Component">
                            <ComponentEditorPage />
                        </AdminLayout>
                    }
                />
                <Dialog name={CREATE_COMPONENT_DIALOG} element={<CreateComponentDialogContent />} />
                <Menu
                    name="remote-components"
                    parent="dev-tools"
                    element={
                        <Menu.Link
                            text="Components"
                            to={getLink(Routes.List)}
                            icon={<Menu.Link.Icon label="Components" element={<ComponentIcon />} />}
                        />
                    }
                />
            </AdminConfig>
        </>
    );
};
