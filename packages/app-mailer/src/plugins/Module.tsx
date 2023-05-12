import React, { lazy, Suspense } from "react";
import { AddMenu as Menu, AddRoute, Plugins } from "@webiny/app-admin";
import { SecureRoute } from "@webiny/app-security";
import { AdminLayout } from "@webiny/app-admin/components/AdminLayout";
import Helmet from "react-helmet";
import { usePermission } from "~/hooks/usePermission";
import { CircularProgress } from "@webiny/ui/Progress";

const Settings = lazy(() => import("~/views/settings"));

interface LoaderProps {
    children: React.ReactElement;
}
const Loader: React.FC<LoaderProps> = ({ children, ...props }) => (
    <Suspense fallback={<CircularProgress />}>{React.cloneElement(children, props)}</Suspense>
);

const MailerSettings: React.FC = () => {
    const { canChangeSettings } = usePermission();

    const changeSettings = canChangeSettings();

    if (!changeSettings) {
        return null;
    }

    return (
        <>
            <Menu name={"settings"}>
                <Menu name={"settings.mailer"} label={"Mailer"}>
                    <Menu
                        name={"settings.mailer.settings"}
                        label={"Settings"}
                        path={"/mailer/settings"}
                    />
                </Menu>
            </Menu>
            <AddRoute
                exact
                path={"/mailer/settings"}
                render={() => (
                    <SecureRoute permission={"mailer.settings"}>
                        <AdminLayout>
                            <Helmet title={"Mailer - Settings"} />
                            <Loader>
                                <Settings />
                            </Loader>
                        </AdminLayout>
                    </SecureRoute>
                )}
            />
        </>
    );
};

export const Module: React.FC = () => {
    return (
        <Plugins>
            <MailerSettings />
        </Plugins>
    );
};
