import { describe } from "vitest";
import { it } from "vitest";
import { expect } from "vitest";
import { vi } from "vitest";
import { createRegisterBuildParamPlugin } from "@webiny/handler";
import { BuildParam } from "@webiny/api-core/features/buildParams/abstractions.js";
import { createServer } from "./createServer.js";

class EncryptionEnabledBuildParam implements BuildParam.Interface {
    key = "EncryptionEnabled";
    value = true;
}

const EncryptionEnabled = BuildParam.createImplementation({
    implementation: EncryptionEnabledBuildParam,
    dependencies: []
});

// What project-standalone's `<Infra.Crypto.Encryption>` bakes into the build.
const encryptionDeclared = createRegisterBuildParamPlugin(ctx => {
    ctx.container.register(EncryptionEnabled);
});

describe("api-event-handler-standalone-sql — declared secrets", () => {
    it("refuses to start when the build declares encryption and env has no passphrase", async () => {
        vi.stubEnv("WEBINY_ENCRYPTION_PASSPHRASE", "");

        await expect(createServer(() => [encryptionDeclared])).rejects.toThrow(
            "WEBINY_ENCRYPTION_PASSPHRASE is not set, but the build uses <Infra.Crypto.Encryption>."
        );
    });

    it("starts when env supplies the passphrase", async () => {
        vi.stubEnv("WEBINY_ENCRYPTION_PASSPHRASE", "test-passphrase");

        const server = await createServer(() => [encryptionDeclared]);
        try {
            const response = await server.graphql("{ __typename }");
            expect(response.statusCode).toBe(200);
        } finally {
            await server.close();
        }
    });
});
