import React from "react";
import { GenericExtension } from "@webiny/api-core/extensions/index.js";
import { useWcpProjectLicense } from "@webiny/project/services/GetProjectConfigService/WcpProjectLicenseContext.js";

interface ExtensionProps {
    src: string;
    exportName?: string;
}

function WcpGatedApiExtension({ src, exportName }: ExtensionProps) {
    const { hasLicense } = useWcpProjectLicense();

    if (!hasLicense) {
        return null;
    }

    return <GenericExtension src={src} exportName={exportName} />;
}

export const WcpApiExtension = {
    Extension: WcpGatedApiExtension
};
