import { z } from "zod";
import { AiPowerUpsSettingsGroupHandler } from "~/api/features/shared/index.js";
import { readLegacyProviderPresets } from "~/api/features/Connections/types.js";
import { AI_MODEL_ROLE_IDS } from "./roles.js";
import { emptyAssignment } from "./types.js";
import type { AiModelRoleAssignments, ModelRolesSettings, PersistedModelRoles } from "./types.js";

const assignmentSchema = z.object({
    connectionId: z.string(),
    model: z.string()
});

const inputSchema = z.object({
    roles: z.object(
        Object.fromEntries(AI_MODEL_ROLE_IDS.map(id => [id, assignmentSchema]))
    ) as unknown as z.ZodType<AiModelRoleAssignments>
});

class ModelRolesHandlerImpl implements AiPowerUpsSettingsGroupHandler.Interface {
    readonly name = "modelRoles";
    readonly inputSchema = inputSchema;

    mapFromStorage(persisted: unknown, all?: Record<string, unknown>): ModelRolesSettings {
        const stored = (persisted ?? {}) as PersistedModelRoles;
        const roles = Object.fromEntries(
            AI_MODEL_ROLE_IDS.map(id => {
                const assignment = stored.roles?.[id];
                return [
                    id,
                    {
                        connectionId: assignment?.connectionId ?? "",
                        model: assignment?.model ?? ""
                    }
                ];
            })
        ) as AiModelRoleAssignments;

        if (roles.standard.model) {
            return { roles };
        }

        /*
         * Nothing has filled `standard` yet, so seed it from the legacy `providers` section. Every
         * AI feature used to read `providers.presets[0]` and nothing else, so lifting exactly that
         * preset into `standard` reproduces the old behaviour for a project that upgrades without
         * touching the settings screen.
         *
         * `fast` and `vision` stay empty on purpose. Both fall back to `standard` at resolve time,
         * so an untouched project keeps working, and the settings screen shows the fallback rather
         * than pretending someone chose it.
         */
        const legacy = readLegacyProviderPresets(all)[0];

        if (legacy?.model) {
            roles.standard = { connectionId: legacy.id, model: legacy.model };
        }

        return { roles };
    }

    async mapToStorage(internal: unknown): Promise<PersistedModelRoles> {
        const input = internal as ModelRolesSettings;

        return {
            roles: Object.fromEntries(
                AI_MODEL_ROLE_IDS.map(id => {
                    const assignment = input.roles?.[id] ?? emptyAssignment();
                    return [
                        id,
                        {
                            connectionId: assignment.connectionId ?? "",
                            model: assignment.model ?? ""
                        }
                    ];
                })
            )
        };
    }
}

export default AiPowerUpsSettingsGroupHandler.createImplementation({
    implementation: ModelRolesHandlerImpl,
    dependencies: []
});
