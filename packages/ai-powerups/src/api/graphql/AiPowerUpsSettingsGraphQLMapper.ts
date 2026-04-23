import { AiPowerUpsSettingsGroupGraphQLMapper } from "~/api/features/shared/index.js";
import { AiPowerUpsSettingsGraphQLMapper } from "./abstractions.js";
import type { IAiPowerUpsSettings } from "~/api/types.js";

class AiPowerUpsSettingsGraphQLMapperImpl implements AiPowerUpsSettingsGraphQLMapper.Interface {
    private mapperLookup: Map<string, AiPowerUpsSettingsGroupGraphQLMapper.Interface>;

    constructor(mappers: AiPowerUpsSettingsGroupGraphQLMapper.Interface[]) {
        this.mapperLookup = new Map(mappers.map(m => [m.name, m]));
    }

    async toApi(settings: IAiPowerUpsSettings): Promise<Record<string, unknown>> {
        const raw = settings as unknown as Record<string, unknown>;
        const result: Record<string, unknown> = {};

        for (const key of Object.keys(raw)) {
            const mapper = this.mapperLookup.get(key);
            result[key] = mapper ? await mapper.toApi(raw[key]) : raw[key];
        }

        return result;
    }

    async fromApi(
        input: Record<string, unknown>,
        current: IAiPowerUpsSettings
    ): Promise<IAiPowerUpsSettings> {
        const currentRaw = current as unknown as Record<string, unknown>;
        const assembled: Record<string, unknown> = { ...currentRaw };

        for (const key of Object.keys(input)) {
            const mapper = this.mapperLookup.get(key);
            assembled[key] = mapper
                ? await mapper.fromApi(input[key], currentRaw[key])
                : input[key];
        }

        return assembled as unknown as IAiPowerUpsSettings;
    }
}

export default AiPowerUpsSettingsGraphQLMapper.createImplementation({
    implementation: AiPowerUpsSettingsGraphQLMapperImpl,
    dependencies: [[AiPowerUpsSettingsGroupGraphQLMapper, { multiple: true }]]
});
