import { z } from "zod";
import { AiPowerUpsSettingsGroupHandler } from "~/api/features/shared/index.js";
import type {
    PersistedProjectPreset,
    PersistedProjects,
    ProjectPreset,
    ProjectsSettings
} from "./types.js";

const fileItemSchema = z.object({
    id: z.string().min(1),
    name: z.string().min(1),
    size: z.number(),
    mimeType: z.string().min(1),
    src: z.string().min(1),
    width: z.number().optional(),
    height: z.number().optional()
});

const TOKEN_BUDGET = 150_000;
const CHARS_PER_TOKEN = 4;
const MAX_CONTEXT_BYTES = TOKEN_BUDGET * CHARS_PER_TOKEN;

const presetSchema = z
    .object({
        id: z.string().min(1),
        name: z.string().min(1),
        description: z.string().nullish().optional(),
        instructions: z.string().nullish().optional(),
        defaultReaderPersonaId: z.string().nullish().optional(),
        defaultWriterPersonaId: z.string().nullish().optional(),
        files: z.array(fileItemSchema).nullish().optional(),
        version: z.number().optional()
    })
    .superRefine((preset, ctx) => {
        const instructionsBytes = preset.instructions?.length ?? 0;
        const files = preset.files ?? [];
        const totalFileBytes = files.reduce((sum, f) => sum + f.size, 0);
        const totalBytes = instructionsBytes + totalFileBytes;

        if (totalBytes <= MAX_CONTEXT_BYTES) {
            return;
        }

        const estimatedTokens = Math.ceil(totalBytes / CHARS_PER_TOKEN);
        const sorted = [...files].sort((a, b) => b.size - a.size);
        const top = sorted
            .slice(0, 3)
            .map(
                f => `${f.name} (~${Math.ceil(f.size / CHARS_PER_TOKEN).toLocaleString()} tokens)`
            );

        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["files"],
            message: `Project "${preset.name}" exceeds the ${TOKEN_BUDGET.toLocaleString()} token budget (~${estimatedTokens.toLocaleString()} tokens). Largest files: ${top.join(", ")}.`
        });
    });

const inputSchema = z.object({
    presets: z.array(presetSchema)
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

    async mapToStorage(internal: unknown, existing: unknown | null): Promise<PersistedProjects> {
        const input = internal as ProjectsSettings;
        const prev = existing as PersistedProjects | null;
        const prevById = new Map((prev?.presets ?? []).map(p => [p.id, p]));

        return {
            presets: input.presets.map(p => {
                const prevProject = prevById.get(p.id);
                const prevVersion = prevProject?.version ?? 0;
                const changed = this.projectChanged(p, prevProject);

                return {
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
                    })),
                    version: changed ? prevVersion + 1 : prevVersion
                };
            })
        };
    }

    private projectChanged(
        current: ProjectPreset,
        prev: PersistedProjectPreset | undefined
    ): boolean {
        if (!prev) {
            return true;
        }
        if (current.instructions !== prev.instructions) {
            return true;
        }
        const currentFileIds = (current.files ?? []).map(f => f.id).join(",");
        const prevFileIds = (prev.files ?? []).map(f => f.id).join(",");
        return currentFileIds !== prevFileIds;
    }
}

export default AiPowerUpsSettingsGroupHandler.createImplementation({
    implementation: ProjectsHandlerImpl,
    dependencies: []
});
