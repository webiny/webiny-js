import { describe } from "vitest";
import { it } from "vitest";
import { expect } from "vitest";
import { createRegisterBuildParamPlugin } from "@webiny/handler";
import { BuildParam } from "@webiny/api-core/features/buildParams/abstractions.js";
import { createServer } from "./createServer.js";

class BakedPassphraseBuildParam implements BuildParam.Interface {
    key = "EncryptionPassphrase";
    value = "baked-passphrase";
}

const BakedPassphrase = BuildParam.createImplementation({
    implementation: BakedPassphraseBuildParam,
    dependencies: []
});

// What the shared <Infra.Crypto.Encryption> from @webiny/project bakes into the build.
const bakedPassphrase = createRegisterBuildParamPlugin(ctx => {
    ctx.container.register(BakedPassphrase);
});

describe("api-event-handler-standalone-sql — secrets at startup", () => {
    it("refuses to start without an encryption passphrase and a hashing pepper", async () => {
        const env = { WEBINY_ENCRYPTION_PASSPHRASE: "", WEBINY_HASHING_PEPPER: " " };

        await expect(createServer(() => [], env)).rejects.toThrow(
            [
                "The standalone API is missing required configuration:",
                "WEBINY_ENCRYPTION_PASSPHRASE is not set.",
                "WEBINY_HASHING_PEPPER is not set."
            ].join("\n  ")
        );
    });

    it("refuses a build that bakes the passphrase, even with env set", async () => {
        await expect(createServer(() => [bakedPassphrase])).rejects.toThrow(
            "The build contains the encryption passphrase (EncryptionPassphrase build param)"
        );
    });

    it("starts when env supplies every secret", async () => {
        const server = await createServer();
        try {
            const response = await server.graphql("{ __typename }");
            expect(response.statusCode).toBe(200);
        } finally {
            await server.close();
        }
    });
});
