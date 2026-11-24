import { Result } from "@webiny/feature/api";
import { Encryption } from "@webiny/api-core/features/encryption/index.js";
import { KeyValueStore } from "@webiny/api-core/features/keyValueStore/index.js";
import { KeyNotFoundError } from "@webiny/api-core/features/keyValueStore/index.js";
import { SaveSettingsRepository } from "./abstractions.js";
import type { TransportSettingsDefinition } from "~/domain/TransportSettings/abstractions.js";
import {
    getStorageKey,
    withDefaults,
    withoutSecrets
} from "~/domain/TransportSettings/findDefinition.js";
import { SettingsPersistenceError, SettingsValidationError } from "~/domain/errors.js";

const isSet = (value: unknown) => value !== undefined && value !== null;

// "Password is required when changing the host, port, secure or user settings."
const secretRequiredMessage = (secret: string, fields: string[]) => {
    const name = secret.charAt(0).toUpperCase() + secret.slice(1);
    const list =
        fields.length > 1
            ? `${fields.slice(0, -1).join(", ")} or ${fields[fields.length - 1]}`
            : fields.join("");
    return `${name} is required when changing the ${list} settings.`;
};

class SaveSettingsRepositoryImpl implements SaveSettingsRepository.Interface {
    constructor(
        private keyValueStore: KeyValueStore.Interface,
        private encryption: Encryption.Interface
    ) {}

    async execute(
        definition: TransportSettingsDefinition.Interface,
        input: TransportSettingsDefinition.Values
    ): SaveSettingsRepository.Return {
        const storageKey = getStorageKey(definition);
        const secrets = definition.secrets ?? [];

        const existingResult =
            await this.keyValueStore.get<TransportSettingsDefinition.Values>(storageKey);
        /*
         * Only a missing key means "nothing saved yet". Any other read failure would have the save
         * below replace the stored secrets and fields with blanks.
         */
        if (existingResult.isFail() && !(existingResult.error instanceof KeyNotFoundError)) {
            return Result.fail(new SettingsPersistenceError(existingResult.error));
        }
        const stored = existingResult.isOk() ? existingResult.value : null;

        // A field left out (or sent as null) keeps its stored value.
        const merged: TransportSettingsDefinition.Values = { ...stored };
        for (const [key, value] of Object.entries(input)) {
            if (isSet(value) && !secrets.includes(key)) {
                merged[key] = value;
            }
        }

        const storedWithDefaults = withDefaults(definition, { ...stored });
        const mergedWithDefaults = withDefaults(definition, merged);
        const boundFieldChanged = (definition.secretsBoundTo ?? []).some(
            field => mergedWithDefaults[field] !== storedWithDefaults[field]
        );

        const data: TransportSettingsDefinition.Values = { ...mergedWithDefaults };
        for (const secret of secrets) {
            let plain = input[secret] ? String(input[secret]) : "";
            if (!plain && stored?.[secret]) {
                /**
                 * Security: re-using a stored secret is only safe while it is sent to the same
                 * server and account. Otherwise a settings editor could point the transport at a
                 * host they control and receive it, so it must be entered again.
                 */
                if (boundFieldChanged) {
                    return Result.fail(
                        new SettingsValidationError([
                            {
                                code: "custom",
                                path: [secret],
                                input: undefined,
                                message: secretRequiredMessage(
                                    secret,
                                    definition.secretsBoundTo ?? []
                                )
                            }
                        ])
                    );
                }
                plain = await this.encryption.decrypt(String(stored[secret]));
            }
            data[secret] = await this.encryption.encrypt(plain);
        }

        const result = await this.keyValueStore.set(storageKey, data);
        if (result.isFail()) {
            return Result.fail(new SettingsPersistenceError(result.error));
        }

        return Result.ok(withoutSecrets(definition, data));
    }
}

export const SaveSettingsRepositoryImplementation = SaveSettingsRepository.createImplementation({
    implementation: SaveSettingsRepositoryImpl,
    dependencies: [KeyValueStore, Encryption]
});
