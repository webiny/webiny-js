import React from "react";
import { useWcpProjectLicense } from "~/services/GetProjectConfigService/WcpProjectLicenseContext.js";

interface ChildrenProps {
    children: React.ReactNode;
}

function CanUseMultiTenancy({ children }: ChildrenProps) {
    const { hasLicense } = useWcpProjectLicense();

    return hasLicense ? <>{children}</> : null;
}

export const Wcp = {
    CanUseMultiTenancy
};
