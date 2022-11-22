import { TenancyContext } from "@webiny/api-tenancy/types";

export interface AdminSettings {
    appUrl: string;
}
export type AdminSettingsVariant = "default" | string;
export interface AdminSettingsService {
    getSettings: (variant?: AdminSettingsVariant) => Promise<AdminSettings | null>;
}
export interface AdminSettingsContext extends TenancyContext {
    settings: AdminSettingsService;
}
