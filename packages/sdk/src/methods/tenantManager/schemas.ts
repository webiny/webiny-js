import { z } from "zod";

const tenantId = z.string().min(1, "tenantId is required");

export const createTenantSchema = z.object({
    data: z.object({
        id: z.string().optional(),
        name: z.string().min(1, "name is required"),
        description: z.string().optional()
    })
});

export const disableTenantSchema = z.object({ tenantId });
export const enableTenantSchema = z.object({ tenantId });
export const installTenantSchema = z.object({ tenantId });
