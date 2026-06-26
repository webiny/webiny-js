import { useCallback } from "react";
import { useFeature } from "@webiny/app-admin";
import { DisableTenantFeature } from "./feature.js";
import type { TenantEntry } from "~/admin/types.js";

export const useDisableTenant = (tenant: TenantEntry) => {
    const { useCase } = useFeature(DisableTenantFeature);

    const disableTenant = useCallback(async () => {
        await useCase.execute(tenant.entryId);
    }, [useCase, tenant]);

    return { disableTenant };
};
