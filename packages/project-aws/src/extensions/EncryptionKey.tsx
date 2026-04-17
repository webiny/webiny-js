import React from "react";
import { z } from "zod";
import { defineExtension } from "@webiny/project/defineExtension/index.js";
import { BuildParam } from "@webiny/project/extensions/index.js";

export const EncryptionKey = defineExtension({
    type: "Infra/Encryption/Key",
    tags: { runtimeContext: "project" },
    description: "Set the encryption key used by the API's EncryptionService.",
    paramsSchema: z.object({
        value: z.string().min(1).describe("The encryption passphrase or secret key.")
    }),
    render({ value }) {
        return <BuildParam paramName="EncryptionKey" value={value} />;
    }
});
