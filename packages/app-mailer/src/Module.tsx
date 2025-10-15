import React, { lazy, Suspense } from "react";
import { AdminConfig, Plugins, AdminLayout, useRouter } from "@webiny/app-admin";
import { HasPermission } from "@webiny/app-security";
import { OverlayLoader } from "@webiny/admin-ui";
import { usePermission } from "~/hooks/usePermission.js";
import { Routes } from "~/routes.js";

const { Menu, Route } = AdminConfig;

const Settings = lazy(
    () =>
        import(
            /* webpackChunkName: "MailerModuleSettings" */
            "~/views/settings/index.js"
        )
);

interface LoaderProps {
    children: React.ReactElement;
}

const Loader = ({ children, ...props }: LoaderProps) => (
    <Suspense fallback={<OverlayLoader />}>{React.cloneElement(children, props)}</Suspense>
);

const MailerSettings = () => {
    const router = useRouter();
    const { canChangeSettings } = usePermission();

    const changeSettings = canChangeSettings();

    if (!changeSettings) {
        return null;
    }

    return (
        <AdminConfig>
            <HasPermission name={"mailer.settings"}>
                <Route
                    route={Routes.Settings}
                    element={
                        <AdminLayout title={"Mailer - Settings"}>
                            <Loader>
                                <Settings />
                            </Loader>
                        </AdminLayout>
                    }
                />
                <Menu
                    name={"mailer.settings"}
                    parent={"settings"}
                    element={<Menu.Group text={"Mailer"} />}
                />
                <Menu
                    name={"mailer.settings.general"}
                    parent={"settings"}
                    pinnable={true}
                    element={<Menu.Link text={"Settings"} to={router.getLink(Routes.Settings)} />}
                />
            </HasPermission>
        </AdminConfig>
    );
};

export const Module = () => {
    return (
        <Plugins>
            <MailerSettings />
        </Plugins>
    );
};
