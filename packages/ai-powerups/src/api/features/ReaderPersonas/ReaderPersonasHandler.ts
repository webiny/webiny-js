import { z } from "zod";
import { AiPowerUpsSettingsGroupHandler } from "~/api/features/shared/index.js";
import type { PersistedReaderPersonas, ReaderPersonasSettings } from "./types.js";

const inputSchema = z.object({
    presets: z.array(
        z.object({
            id: z.string().min(1),
            name: z.string().min(1),
            description: z.string().min(1),
            style: z.string().nullish().optional()
        })
    )
});

class ReaderPersonasHandlerImpl implements AiPowerUpsSettingsGroupHandler.Interface {
    readonly name = "readerPersonas";
    readonly inputSchema = inputSchema;

    mapFromStorage(persisted: unknown): ReaderPersonasSettings {
        if (!persisted || typeof persisted !== "object") {
            return { presets: [] };
        }

        const data = persisted as PersistedReaderPersonas;
        return { presets: data.presets ?? [] };
    }

    async mapToStorage(internal: unknown): Promise<PersistedReaderPersonas> {
        const input = internal as ReaderPersonasSettings;
        return {
            presets: input.presets.map(p => ({
                id: p.id,
                name: p.name,
                description: p.description,
                style: p.style
            }))
        };
    }
}

export default AiPowerUpsSettingsGroupHandler.createImplementation({
    implementation: ReaderPersonasHandlerImpl,
    dependencies: []
});
