import React from "react";
import { z } from "zod";
import { defineExtension } from "@webiny/project/defineExtension/index.js";
import { BuildParam } from "@webiny/project/extensions/index.js";

const SUPPORTED_ALGORITHMS = ["aes-128-gcm", "aes-192-gcm", "aes-256-gcm"] as const;

export const Encryption = defineExtension({
    type: "Infra/Encryption",
    tags: { runtimeContext: "project" },
    description: "Configure the API's EncryptionService.",
    paramsSchema: z.object({
        passphrase: z
            .string()
            .min(1)
            .describe("The passphrase used to derive the AES encryption key via scrypt."),
        salt: z
            .string()
            .min(1)
            .optional()
            .describe(
                "Optional scrypt salt. Ensures two projects using the same passphrase derive different encryption keys."
            ),
        algorithm: z
            .enum(SUPPORTED_ALGORITHMS)
            .optional()
            .describe("AES-GCM algorithm. Defaults to aes-256-gcm.")
    }),
    render({ passphrase, salt, algorithm }) {
        return (
            <>
                <BuildParam paramName="EncryptionPassphrase" value={passphrase} />
                {salt && <BuildParam paramName="EncryptionSalt" value={salt} />}
                {algorithm && <BuildParam paramName="EncryptionAlgorithm" value={algorithm} />}
            </>
        );
    }
});
