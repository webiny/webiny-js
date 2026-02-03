import { useState, useCallback } from "react";
import { useFeature } from "@webiny/app-admin";
import { EnableTenantFeature } from "./feature.js";

export const useEnableTenant = () => {
    const { useCase } = useFeature(EnableTenantFeature);
    const [loading, setLoading] = useState(false);

    const enableTenant = useCallback(
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

    return { enableTenant, loading };
};
