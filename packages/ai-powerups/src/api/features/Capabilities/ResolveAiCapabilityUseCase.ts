import { Result } from "@webiny/feature/api";
import { Encryption } from "@webiny/api-core/features/encryption/index.js";
import { GetSettingsUseCase } from "~/api/features/GetSettings/index.js";
import { sdkNameFromModel } from "~/api/features/Connections/index.js";
import { AiCapability, ResolveAiCapabilityUseCase } from "./abstractions.js";
import type { IResolvedAiCapability } from "./abstractions.js";
import type { AiCapabilityOverride } from "./types.js";
import type { AiModelRoleId } from "~/api/features/ModelRoles/index.js";
import type { IAiPowerUpsSettings } from "~/api/types.js";

const SETTINGS_PATH = "Settings → AI Power-Ups";

/**
 * Turns a capability id into the model, credential and prompt text a use case needs.
 *
 * This is the single place that knows the precedence rules. Before it existed, six use cases each
 * read `providers.presets[0]`, re-derived the SDK name from the model string and decrypted the key
 * themselves, so "which model runs this feature" had six answers that only happened to agree.
 *
 * Precedence: a capability's pinned connection+model, else its chosen role, else its declared
 * default role, else the `standard` role.
 *
 * There is deliberately no environment-variable fallback. A project whose settings say one thing
 * and whose requests use another is the exact confusion this replaces.
 */
class ResolveAiCapabilityUseCaseImpl implements ResolveAiCapabilityUseCase.Interface {
    private capabilityLookup: Map<string, AiCapability.Interface>;

    constructor(
        capabilities: AiCapability.Interface[],
        private getSettings: GetSettingsUseCase.Interface,
        private encryption: Encryption.Interface
    ) {
        this.capabilityLookup = new Map(capabilities.map(c => [c.id, c]));
    }

    async execute(capabilityId: string): Promise<Result<IResolvedAiCapability, Error>> {
        const capability = this.capabilityLookup.get(capabilityId);

        if (!capability) {
            // Nothing a project can do about this one: the caller passed an unregistered id.
            return Result.fail(
                new Error(
                    `Unknown AI capability "${capabilityId}". Register it with the AiCapability abstraction.`
                )
            );
        }

        const settingsResult = await this.getSettings.execute();
        if (settingsResult.isFail()) {
            return Result.fail(new Error("Failed to load AI Power-Ups settings."));
        }

        const settings = settingsResult.value;
        const override: AiCapabilityOverride =
            settings.capabilities?.overrides?.[capabilityId] ?? {};

        const selection = this.selectModel(settings, capability.defaultRole, override);
        if (selection.isFail()) {
            return Result.fail(selection.error);
        }

        const { connectionId, model, roleId, fellBackToStandard } = selection.value;

        const connection = settings.connections?.presets?.find(c => c.id === connectionId);

        if (!connection) {
            return Result.fail(
                new Error(
                    `"${capability.label}" points at a connection that no longer exists. Pick one under ${SETTINGS_PATH} → Model roles.`
                )
            );
        }

        if (!connection.apiKeyEncrypted) {
            return Result.fail(
                new Error(
                    `The connection "${connection.name}" has no API key. Add one under ${SETTINGS_PATH} → Connections.`
                )
            );
        }

        /*
         * A model is stored fully qualified ("anthropic/claude-sonnet-4-5") and a connection stores
         * its vendor separately, so the two can disagree if a connection is re-pointed at another
         * vendor after a role was filled. Catching it here beats a provider-side auth error.
         */
        const modelSdkName = sdkNameFromModel(model);
        if (modelSdkName && connection.sdkName && modelSdkName !== connection.sdkName) {
            return Result.fail(
                new Error(
                    `The model "${model}" cannot run on the "${connection.name}" connection, which is a ${connection.sdkName} credential. Fix the pairing under ${SETTINGS_PATH} → Model roles.`
                )
            );
        }

        return Result.ok({
            capabilityId,
            model,
            connection: {
                sdkName: modelSdkName || connection.sdkName,
                apiKey: await this.encryption.decrypt(connection.apiKeyEncrypted)
            },
            roleId,
            fellBackToStandard,
            // The switch is what decides, not the presence of text. A project that turns the
            // override off keeps its draft in settings but goes back to running Webiny's prompt.
            guidance:
                override.replacePrompt && override.guidance?.trim()
                    ? override.guidance
                    : (capability.guidance ?? ""),
            additionalInstructions: override.additionalInstructions?.trim() ?? ""
        });
    }

    private selectModel(
        settings: IAiPowerUpsSettings,
        defaultRole: AiModelRoleId,
        override: AiCapabilityOverride
    ): Result<
        {
            connectionId: string;
            model: string;
            roleId: AiModelRoleId | null;
            fellBackToStandard: boolean;
        },
        Error
    > {
        // A pinned connection+model wins outright. Both halves are required; one alone is a
        // half-finished edit, so it is ignored rather than guessed at.
        if (override.connectionId && override.model) {
            return Result.ok({
                connectionId: override.connectionId,
                model: override.model,
                roleId: null,
                fellBackToStandard: false
            });
        }

        const roles = settings.modelRoles?.roles;
        const requestedRole = (override.roleId || defaultRole) as AiModelRoleId;
        const requested = roles?.[requestedRole];

        if (requested?.connectionId && requested.model) {
            return Result.ok({
                connectionId: requested.connectionId,
                model: requested.model,
                roleId: requestedRole,
                fellBackToStandard: false
            });
        }

        /*
         * An unfilled role falls back to `standard` rather than failing. That is what keeps an
         * upgrade quiet: migration fills only `standard`, and every feature that used to read
         * `providers.presets[0]` keeps running on exactly the model it ran on before.
         *
         * It does mean an unfilled `vision` role sends images to whatever `standard` holds. Same
         * as today's behaviour, and the settings screen says so next to the role.
         */
        const standard = roles?.standard;

        if (standard?.connectionId && standard.model) {
            return Result.ok({
                connectionId: standard.connectionId,
                model: standard.model,
                roleId: "standard",
                fellBackToStandard: requestedRole !== "standard"
            });
        }

        return Result.fail(
            new Error(
                `No model is configured for the "${requestedRole}" role. Pick one under ${SETTINGS_PATH} → Model roles.`
            )
        );
    }
}

export const ResolveAiCapabilityUseCaseImplementation =
    ResolveAiCapabilityUseCase.createImplementation({
        implementation: ResolveAiCapabilityUseCaseImpl,
        dependencies: [[AiCapability, { multiple: true }], GetSettingsUseCase, Encryption]
    });
