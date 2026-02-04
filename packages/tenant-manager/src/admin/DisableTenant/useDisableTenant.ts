import { useCallback } from "react";
import { useFeature } from "@webiny/app-admin";
import { DisableTenantFeature } from "./feature.js";
import { useRecords } from "@webiny/app-aco";
import type { TenantEntry } from "~/admin/types.js";

export const useDisableTenant = (tenant: TenantEntry) => {
    const { useCase } = useFeature(DisableTenantFeature);
    const { updateRecordInCache } = useRecords();

    const disableTenant = useCallback(async () => {
        await useCase.execute(tenant.entryId);

        updateRecordInCache({
            ...tenant,
            values: {
                ...tenant.values,
                status: "disabled"
            }
        });
    }, [useCase, tenant]);

    return { disableTenant };
};
