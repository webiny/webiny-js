import { AiPowerUpsSettingsGroupGraphQLMapper } from "~/api/features/shared/index.js";
import type { ProvidersSettings } from "./types.js";

interface ApiProviderPreset {
    id: string;
    name: string;
    description?: string;
    model: string;
    apiKey: string | null;
}

interface ApiProviders {
    presets: ApiProviderPreset[];
}

interface ApiInputProviderPreset {
    id: string;
    name: string;
    description?: string;
    model: string;
    apiKey?: string;
}

interface ApiInputProviders {
    presets: ApiInputProviderPreset[];
}

class ProvidersGraphQLMapperImpl implements AiPowerUpsSettingsGroupGraphQLMapper.Interface {
    readonly name = "providers";

    toApi(internal: unknown): ApiProviders {
        const data = internal as ProvidersSettings;
        return {
            presets: data.presets.map(p => ({
                id: p.id,
                name: p.name,
                description: p.description,
                model: p.model,
                apiKey: p.apiKeyMasked ?? null
            }))
        };
    }

    fromApi(api: unknown): ProvidersSettings {
        const data = api as ApiInputProviders;
        return {
            presets: data.presets.map(p => ({
                id: p.id,
                name: p.name,
                description: p.description,
                model: p.model,
                apiKey: p.apiKey,
                apiKeyMasked: "",
                apiKeyEncrypted: ""
            }))
        };
    }
}

export default AiPowerUpsSettingsGroupGraphQLMapper.createImplementation({
    implementation: ProvidersGraphQLMapperImpl,
    dependencies: []
});
