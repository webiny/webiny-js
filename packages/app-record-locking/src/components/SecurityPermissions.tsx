import React from "react";
import { AdminConfig } from "@webiny/app-admin";
import { ReactComponent as LockIcon } from "@webiny/icons/lock.svg";
import { RECORD_LOCKING_PERMISSIONS_SCHEMA } from "~/domain/permissionsSchema.js";

const { Security } = AdminConfig;

export const SecurityPermissions = () => {
    return (
        <AdminConfig>
            <Security.Permissions
                name="record-locking"
                title="Record Locking"
                description="Manage Record Locking permissions."
                icon={<LockIcon />}
                schema={RECORD_LOCKING_PERMISSIONS_SCHEMA}
            />
        </AdminConfig>
    );
};
