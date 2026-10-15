import React, { Fragment } from "react";
import { useFeature } from "@webiny/app";
import { useRouter } from "@webiny/app";
import { ReactComponent as DevToolsIcon } from "@webiny/icons/developer_mode.svg";
import { ReactComponent as DebuggerIcon } from "@webiny/icons/bug_report.svg";
import { AdminConfig } from "~/config/AdminConfig.js";
import { AdminLayout } from "~/components/AdminLayout.js";
import { createReactiveComponent } from "~/presentation/createReactiveComponent.js";
import { DebuggerPresenterFeature } from "~/presentation/debugger/feature.js";
import { DebuggerRoutes } from "~/presentation/debugger/routes.js";
import { DebuggerView } from "~/presentation/debugger/components/DebuggerView.js";
import { DebuggerIndicator } from "~/presentation/debugger/components/DebuggerIndicator.js";

const { Menu, Route } = AdminConfig;

/*
 * Shown only to identities that hold the permission itself. `HasPermission` matches globs, so
 * Dev Tools full access would show a panel whose capture never turns on.
 */
const DebuggerMenuItem = createReactiveComponent(() => {
    const { presenter } = useFeature(DebuggerPresenterFeature);
    const router = useRouter();

    if (!presenter.vm.available) {
        return null;
    }

    return (
        <AdminConfig>
            <Menu
                name={"dev-tools"}
                hideIfEmpty={true}
                pin={"end"}
                element={
                    <Menu.Item
                        text={"Dev Tools"}
                        icon={<Menu.Item.Icon label="Dev Tools" element={<DevToolsIcon />} />}
                    />
                }
            />
            <Menu
                name={"dev-tools.debugger"}
                parent={"dev-tools"}
                element={
                    <Menu.Link
                        text={"Debugger"}
                        to={router.getLink(DebuggerRoutes.Debugger)}
                        icon={<Menu.Link.Icon label="Debugger" element={<DebuggerIcon />} />}
                    />
                }
            />
        </AdminConfig>
    );
});

export const DebuggerExtension = () => {
    return (
        <Fragment>
            {/* Installs the real header control over the Layout's placeholder. */}
            <DebuggerIndicator />
            <DebuggerMenuItem />
            <AdminConfig>
                <Route
                    route={DebuggerRoutes.Debugger}
                    element={
                        <AdminLayout title={"Debugger"}>
                            <AdminConfig.Breadcrumb name={"dev-tools"} label={"Dev Tools"} />
                            <AdminConfig.Breadcrumb name={"debugger"} label={"Debugger"} />
                            <DebuggerView />
                        </AdminLayout>
                    }
                />
            </AdminConfig>
        </Fragment>
    );
};
