import { z } from "zod";
import { AiPowerUpsSettingsGroupHandler } from "~/api/features/shared/index.js";
import type { PersistedProjects, ProjectsSettings } from "./types.js";

const fileItemSchema = z.object({
    id: z.string().min(1),
    name: z.string().min(1),
    size: z.number(),
    mimeType: z.string().min(1),
    src: z.string().min(1),
    width: z.number().optional(),
    height: z.number().optional()
});

const inputSchema = z.object({
    presets: z.array(
        z.object({
            id: z.string().min(1),
            name: z.string().min(1),
            description: z.string().nullish().optional(),
            instructions: z.string().nullish().optional(),
            defaultReaderPersonaId: z.string().nullish().optional(),
            defaultWriterPersonaId: z.string().nullish().optional(),
            files: z.array(fileItemSchema).nullish().optional()
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
                defaultWriterPersonaId: p.defaultWriterPersonaId,
                files: (p.files ?? []).map(f => ({
                    id: f.id,
                    name: f.name,
                    size: f.size,
                    mimeType: f.mimeType,
                    src: f.src,
                    width: f.width,
                    height: f.height
                }))
            }))
        };
    }
}

export default AiPowerUpsSettingsGroupHandler.createImplementation({
    implementation: ProjectsHandlerImpl,
    dependencies: []
});
