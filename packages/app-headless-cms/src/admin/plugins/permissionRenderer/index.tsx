import React from "react";
import { AdminConfig } from "@webiny/app-admin";
import { ReactComponent as PermissionsIcon } from "@webiny/icons/devices_other.svg";
import { CMSPermissions } from "./CmsPermissions.js";

const { Security } = AdminConfig;

export const CmsSecurityPermission = () => (
    <AdminConfig>
        <Security.Permissions
            name="cms"
            title="Headless CMS"
            description="Manage Headless CMS permissions."
            icon={<PermissionsIcon />}
            element={<CMSPermissions />}
        />
    </AdminConfig>
);
