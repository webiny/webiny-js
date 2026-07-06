import React from "react";
import { z } from "zod";
import { defineExtension } from "@webiny/project/defineExtension/index.js";
import { BuildParam } from "@webiny/project/extensions/index.js";

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
                    "invalidates existing hashes."
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
                {pepper && <BuildParam paramName="HashingPepper" value={pepper} />}
                {cost && <BuildParam paramName="HashingCost" value={cost} />}
            </>
        );
    }
});
