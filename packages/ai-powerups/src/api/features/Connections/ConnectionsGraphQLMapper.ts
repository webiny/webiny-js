import { AiPowerUpsSettingsGroupGraphQLMapper } from "~/api/features/shared/index.js";
import type { ConnectionsSettings } from "./types.js";

interface ApiConnectionPreset {
    id: string;
    name: string;
    sdkName: string;
    apiKey: string | null;
}

interface ApiConnections {
    presets: ApiConnectionPreset[];
}

interface ApiInputConnectionPreset {
    id: string;
    name: string;
    sdkName: string;
    apiKey?: string;
}

class ConnectionsGraphQLMapperImpl implements AiPowerUpsSettingsGroupGraphQLMapper.Interface {
    readonly name = "connections";

    toApi(internal: unknown): ApiConnections {
        const data = internal as ConnectionsSettings;
        return {
            presets: data.presets.map(p => ({
                id: p.id,
                name: p.name,
                sdkName: p.sdkName,
                // The admin form only ever sees the mask. The plaintext key never leaves the api.
                apiKey: p.apiKeyMasked ?? null
            }))
        };
    }

    fromApi(api: unknown): ConnectionsSettings {
        const data = api as { presets: ApiInputConnectionPreset[] };
        return {
            presets: data.presets.map(p => ({
                id: p.id,
                name: p.name,
                sdkName: p.sdkName,
                apiKey: p.apiKey,
                apiKeyMasked: "",
                apiKeyEncrypted: ""
            }))
        };
    }
}

export default AiPowerUpsSettingsGroupGraphQLMapper.createImplementation({
    implementation: ConnectionsGraphQLMapperImpl,
    dependencies: []
});
