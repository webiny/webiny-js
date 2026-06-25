import { useState, useCallback } from "react";
import { useFeature } from "@webiny/app-admin";
import { InstallTenantFeature } from "./feature.js";

export const useInstallTenant = () => {
    const { useCase } = useFeature(InstallTenantFeature);
    const [loading, setLoading] = useState(false);

    const installTenant = useCallback(
        async (tenantId: string) => {
            setLoading(true);

            try {
                await useCase.execute(tenantId);
            } finally {
                setLoading(false);
            }
        },
        [useCase]
    );

    return { installTenant, loading };
};
