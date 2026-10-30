import React from "react";
import { z } from "zod";
import { defineExtension } from "@webiny/project/extensions/index.js";
import { EnvVar } from "@webiny/project/extensions/index.js";
import { BuildParam } from "@webiny/project/extensions/index.js";

/**
 * Hashing settings for a standalone project. A standalone API always folds a pepper into every hash:
 * it refuses to start without `WEBINY_HASHING_PEPPER` (`readStandaloneConfig` in
 * @webiny/api-event-handler-standalone).
 *
 * The pepper is a secret that differs per environment, so it is not baked into the build. This
 * component sets it as the `WEBINY_HASHING_PEPPER` env var for `webiny watch` and `webiny serve`; a
 * deployed API reads it from its own environment. The cost is not secret and stays a build param.
 */
export const Hashing = defineExtension({
    type: "Infra/Hashing",
    tags: { runtimeContext: "project" },
    description: "Configure the API's hashing service (scrypt).",
    paramsSchema: z.object({
        pepper: z
            .string()
            .min(1)
            .optional()
            .describe(
                "Server-side secret folded into every hash (a 'pepper'). It is NOT stored with the " +
                    "hash, so a stolen database alone cannot be brute-forced without it. Changing it " +
                    "invalidates existing hashes. Used by `webiny watch` and `webiny serve` as " +
                    "WEBINY_HASHING_PEPPER; a deployed API reads WEBINY_HASHING_PEPPER from its own " +
                    "environment."
            ),
        cost: z
            .number()
            .int()
            .positive()
            .optional()
            .describe("scrypt CPU/memory cost parameter N (a power of two). Defaults to 16384.")
    }),
    render({ pepper, cost }) {
        return (
            <>
                {pepper && <EnvVar varName="WEBINY_HASHING_PEPPER" value={pepper} />}
                {cost && <BuildParam paramName="HashingCost" value={cost} />}
            </>
        );
    }
});
