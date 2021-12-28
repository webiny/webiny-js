import { useSecurity } from "@webiny/app-security";

export const IsRootTenant = ({ children }) => {
    const security = useSecurity();

    if (!security) {
        return null;
    }

    const { currentTenant } = security.identity;

    if (currentTenant.id !== "root") {
        return null;
    }

    return children;
};
