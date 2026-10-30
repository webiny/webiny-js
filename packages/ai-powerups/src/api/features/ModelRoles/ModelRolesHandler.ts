import { z } from "zod";
import { AiPowerUpsSettingsGroupHandler } from "~/api/features/shared/index.js";
import { readLegacyProviderPresets } from "~/api/features/Connections/legacyProviders.js";
import { AI_MODEL_ROLE_IDS } from "./roles.js";
import { emptyAssignment } from "./types.js";
import type { AiModelRoleAssignments, ModelRolesSettings, PersistedModelRoles } from "./types.js";

/*
 * The admin form sends `null`, not `""`, for a field nobody has touched, and an unfilled role is
 * the normal state of two of the three. `nullish` keeps an untouched role from failing validation;
 * `mapToStorage` is what normalises it to `""`.
 */
const formString = z.string().nullish();

const assignmentSchema = z.object({
    connectionId: formString,
    model: formString
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
         * preset reproduces the old behaviour for a project that upgrades without touching the
         * settings screen.
         *
         * `vision` gets the same preset, because it does not fall back: image enrichment ran on
         * that model before the upgrade and has to keep running on it. Seeding it, rather than
         * falling back at resolve time, also means the settings screen shows which model reads
         * images instead of hiding the choice.
         *
         * `fast` stays empty on purpose. It falls back to `standard`, so an untouched project keeps
         * working, and the screen shows the fallback rather than pretending someone chose it.
         */
        const legacy = readLegacyProviderPresets(all)[0];

        if (legacy?.model) {
            roles.standard = { connectionId: legacy.id, model: legacy.model };

            if (!roles.vision.model) {
                roles.vision = { connectionId: legacy.id, model: legacy.model };
            }
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
