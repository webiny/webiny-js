import { z } from "zod";
import { AiPowerUpsSettingsGroupHandler } from "~/api/features/shared/index.js";
import type { PersistedWriterPersonas, WriterPersonasSettings } from "./types.js";

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

class WriterPersonasHandlerImpl implements AiPowerUpsSettingsGroupHandler.Interface {
    readonly name = "writerPersonas";
    readonly inputSchema = inputSchema;

    mapFromStorage(persisted: unknown): WriterPersonasSettings {
        if (!persisted || typeof persisted !== "object") {
            return { presets: [] };
        }

        const data = persisted as PersistedWriterPersonas;
        return { presets: data.presets ?? [] };
    }

    async mapToStorage(internal: unknown): Promise<PersistedWriterPersonas> {
        const input = internal as WriterPersonasSettings;
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
    implementation: WriterPersonasHandlerImpl,
    dependencies: []
});
