import React from "react";
import { z } from "zod";
import { defineExtension } from "@webiny/project/extensions/index.js";
import { EnvVar } from "@webiny/project/extensions/index.js";
import { BuildParam } from "@webiny/project/extensions/index.js";

const SUPPORTED_ALGORITHMS = ["aes-128-gcm", "aes-192-gcm", "aes-256-gcm"] as const;

/**
 * Encryption settings for a standalone project. A standalone API always encrypts: it refuses to start
 * without `WEBINY_ENCRYPTION_PASSPHRASE` (`readStandaloneConfig` in @webiny/api-event-handler-standalone).
 *
 * The passphrase and salt are secrets that differ per environment, so they are not baked into the
 * build. This component sets them as the `WEBINY_ENCRYPTION_PASSPHRASE` and `WEBINY_ENCRYPTION_SALT`
 * env vars for `webiny watch` and `webiny serve`; a deployed API reads them from its own environment.
 * The algorithm is not secret and stays a build param.
 */
export const Encryption = defineExtension({
    type: "Infra/Encryption",
    tags: { runtimeContext: "project" },
    description: "Configure the API's EncryptionService (always on in standalone).",
    paramsSchema: z.object({
        passphrase: z
            .string()
            .min(1)
            .describe(
                "The passphrase used to derive the AES encryption key via scrypt. Used by " +
                    "`webiny watch` and `webiny serve` as WEBINY_ENCRYPTION_PASSPHRASE; a deployed " +
                    "API reads WEBINY_ENCRYPTION_PASSPHRASE from its own environment."
            ),
        salt: z
            .string()
            .min(1)
            .optional()
            .describe(
                "Optional scrypt salt (WEBINY_ENCRYPTION_SALT). Ensures two projects using the same passphrase derive different encryption keys."
            ),
        algorithm: z
            .enum(SUPPORTED_ALGORITHMS)
            .optional()
            .describe("AES-GCM algorithm. Defaults to aes-256-gcm.")
    }),
    render({ passphrase, salt, algorithm }) {
        return (
            <>
                <EnvVar varName="WEBINY_ENCRYPTION_PASSPHRASE" value={passphrase} />
                {salt && <EnvVar varName="WEBINY_ENCRYPTION_SALT" value={salt} />}
                {algorithm && <BuildParam paramName="EncryptionAlgorithm" value={algorithm} />}
            </>
        );
    }
});
