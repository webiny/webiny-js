import { z } from "zod";
import { AiPowerUpsSettingsGroupHandler } from "~/api/features/shared/index.js";
import type { PersistedProjects, ProjectsSettings } from "./types.js";

const inputSchema = z.object({
    presets: z.array(
        z.object({
            id: z.string().min(1),
            name: z.string().min(1),
            description: z.string().nullish().optional(),
            instructions: z.string().nullish().optional(),
            defaultReaderPersonaId: z.string().nullish().optional(),
            defaultWriterPersonaId: z.string().nullish().optional()
        })
    )
});

class ProjectsHandlerImpl implements AiPowerUpsSettingsGroupHandler.Interface {
    readonly name = "projects";
    readonly inputSchema = inputSchema;

    mapFromStorage(persisted: unknown): ProjectsSettings {
        if (!persisted || typeof persisted !== "object") {
            return { presets: [] };
        }

        const data = persisted as PersistedProjects;
        return { presets: data.presets ?? [] };
    }

    async mapToStorage(internal: unknown): Promise<PersistedProjects> {
        const input = internal as ProjectsSettings;
        return {
            presets: input.presets.map(p => ({
                id: p.id,
                name: p.name,
                description: p.description,
                instructions: p.instructions,
                defaultReaderPersonaId: p.defaultReaderPersonaId,
                defaultWriterPersonaId: p.defaultWriterPersonaId
            }))
        };
    }
}

export default AiPowerUpsSettingsGroupHandler.createImplementation({
    implementation: ProjectsHandlerImpl,
    dependencies: []
});
