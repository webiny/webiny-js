import React from "react";
import { z } from "zod";
import { defineExtension } from "@webiny/project/defineExtension/index.js";
import { BuildParam } from "@webiny/project/extensions/index.js";

export const PasswordHashing = defineExtension({
    type: "Infra/PasswordHashing",
    tags: { runtimeContext: "project" },
    description: "Configure the API's password hashing (scrypt).",
    paramsSchema: z.object({
        pepper: z
            .string()
            .min(1)
            .optional()
            .describe(
                "Server-side secret folded into every password hash (a 'pepper'). It is NOT stored " +
                    "with the hash, so a stolen database alone cannot be brute-forced without it. " +
                    "Changing it invalidates existing passwords."
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
                {pepper && <BuildParam paramName="PasswordHashingPepper" value={pepper} />}
                {cost && <BuildParam paramName="PasswordHashingCost" value={cost} />}
            </>
        );
    }
});
