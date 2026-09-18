import React from "react";
import { AdminConfig } from "~/config/AdminConfig.js";
import { ReactComponent as DebuggerIcon } from "@webiny/icons/bug_report.svg";
import { DEBUGGER_PERMISSIONS_SCHEMA } from "~/features/debugger/permissions.js";

const { Security } = AdminConfig;

export const SecurityPermission = () => {
    return (
        <AdminConfig>
            <Security.Permissions
                name={"dev-tools"}
                title={"Debugger"}
                description={"Manage debug capture access."}
                icon={<DebuggerIcon />}
                schema={DEBUGGER_PERMISSIONS_SCHEMA}
            />
        </AdminConfig>
    );
};
