import { useCurrentTenant } from "@webiny/app-tenant-manager";
import { useThemeManager } from "./useThemeManager";

export function useTenantThemes() {
    const { loading, tenant } = useCurrentTenant();
    const { themes } = useThemeManager();

    if (loading) {
        return [];
    }

    return themes.filter(theme => tenant.settings.themes.includes(theme.name));
}
