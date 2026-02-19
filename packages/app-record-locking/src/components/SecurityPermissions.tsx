import React from "react";
import { AdminConfig } from "@webiny/app-admin";
import { ReactComponent as LockIcon } from "@webiny/icons/lock.svg";

const { Security } = AdminConfig;

export const SecurityPermissions = () => {
    return (
        <AdminConfig>
            <Security.Permissions
                name="record-locking"
                title="Record Locking"
                description="Manage Record Locking permissions."
                icon={<LockIcon />}
                schema={{
                    prefix: "recordLocking",
                    fullAccess: { name: "recordLocking", canForceUnlock: "yes" }
                }}
            />
        </AdminConfig>
    );
};
