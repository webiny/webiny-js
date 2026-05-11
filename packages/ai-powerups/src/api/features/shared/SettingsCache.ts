import type { SettingsCacheEntry } from "./abstractions.js";
import { AiPowerUpsSettingsCache as Abstraction } from "./abstractions.js";
import type { IAiPowerUpsSettings } from "~/api/types.js";

class AiPowerUpsSettingsCacheImpl implements Abstraction.Interface {
    private cached: SettingsCacheEntry | null = null;

    get(): SettingsCacheEntry | null {
        return this.cached;
    }

    set(raw: Record<string, unknown>, mapped: IAiPowerUpsSettings): void {
        this.cached = { raw, mapped };
    }
}

export const AiPowerUpsSettingsCache = Abstraction.createImplementation({
    implementation: AiPowerUpsSettingsCacheImpl,
    dependencies: []
});
