import React from "react";
import { AdminExtension } from "@webiny/app-admin/extensions/index.js";
import { useWcpProjectLicense } from "@webiny/project/services/GetProjectConfigService/WcpProjectLicenseContext.js";

interface ExtensionProps {
    src: string;
    exportName?: string;
}

function WcpGatedAdminExtension({ src, exportName }: ExtensionProps) {
    const { hasLicense } = useWcpProjectLicense();

    if (!hasLicense) {
        return null;
    }

    return <AdminExtension src={src} exportName={exportName} />;
}

export const WcpAdminExtension = {
    Extension: WcpGatedAdminExtension
};
