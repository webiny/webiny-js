import { describe, expect, it, vi } from "vitest";
import { Container } from "@webiny/di";
import { MainGraphQLClient } from "@webiny/app/features/mainGraphQLClient/index.js";
import { TransportSettingsGateway } from "~/features/transportSettings/abstractions.js";
import { TransportSettingsFeature } from "~/features/transportSettings/feature.js";

const setup = (result: unknown) => {
    const execute = vi.fn(async () => result);
    const container = new Container();
    container.registerInstance(MainGraphQLClient, {
        execute
    } as unknown as MainGraphQLClient.Interface);
    TransportSettingsFeature.register(container);
    return { gateway: container.resolve(TransportSettingsGateway), execute };
};

const data = {
    transport: "Acme/HttpTransport",
    settings: { from: "a@acme.test" },
    source: "storage"
};

describe("TransportSettingsGateway", () => {
    it("reads a transport's settings by name", async () => {
        const { gateway, execute } = setup({
            mailer: { getTransportSettings: { data, error: null } }
        });

        await expect(gateway.get("Acme/HttpTransport")).resolves.toEqual(data);
        expect(execute).toHaveBeenCalledWith(
            expect.objectContaining({ variables: { transport: "Acme/HttpTransport" } })
        );
    });

    it("saves a transport's settings and returns what was stored", async () => {
        const { gateway, execute } = setup({
            mailer: { saveTransportSettings: { data, error: null } }
        });

        await expect(
            gateway.save("Acme/HttpTransport", { from: "a@acme.test", apiKey: "k" })
        ).resolves.toEqual(data);
        expect(execute).toHaveBeenCalledWith(
            expect.objectContaining({
                variables: {
                    transport: "Acme/HttpTransport",
                    settings: { from: "a@acme.test", apiKey: "k" }
                }
            })
        );
    });

    it("throws the API's error message", async () => {
        const { gateway } = setup({
            mailer: {
                saveTransportSettings: {
                    data: null,
                    error: {
                        code: "Mailer/Settings/Validation",
                        message: "Settings validation failed.",
                        data: null
                    }
                }
            }
        });

        await expect(gateway.save("Acme/HttpTransport", {})).rejects.toThrow(
            "Settings validation failed."
        );
    });
});
