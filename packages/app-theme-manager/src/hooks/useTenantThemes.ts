import { useCurrentTenant } from "@webiny/app-tenant-manager";
import { useThemeManager } from "./useThemeManager";

export function useTenantThemes() {
    const { loading, tenant } = useCurrentTenant();
    const { themes } = useThemeManager();

    if (loading || !tenant) {
        return [];
    }

    const settings = tenant.settings;
    if (!settings) {
        console.log(`Missing settings on tenant "${tenant.id}".`);
        return [];
    }
    const settingsThemes = settings.themes;
    if (!settingsThemes || Array.isArray(settingsThemes) === false) {
        console.log(`Missing settings.themes on tenant "${tenant.id}".`);
        return [];
    }

    return themes.filter(theme => settingsThemes.includes(theme.name));
}
