import { describe, expect, it, vi } from "vitest";
import { createGraphQLHandler } from "./graphQLHandler";
import { registerSettingsTransport, SETTINGS_TRANSPORT } from "./helpers/registerSettingsTransport";
import { MailerSettingsAfterSaveEventHandler } from "~/features/SaveSettings/abstractions.js";

const GET = /* GraphQL */ `
    query Get($transport: String!) {
        mailer {
            getTransportSettings(transport: $transport) {
                data {
                    transport
                    settings
                    source
                }
                error {
                    code
                    message
                }
            }
        }
    }
`;

const SAVE = /* GraphQL */ `
    mutation Save($transport: String!, $settings: JSON!) {
        mailer {
            saveTransportSettings(transport: $transport, settings: $settings) {
                data {
                    transport
                    settings
                    source
                }
                error {
                    code
                    message
                }
            }
        }
    }
`;

const setup = (params: { permissions?: any[]; plugins?: any[] } = {}) => {
    const send = vi.fn(async (_settings: any, _params: any) => ({ result: "queued", error: null }));
    const handler = createGraphQLHandler({
        permissions: params.permissions,
        plugins: [registerSettingsTransport(send), ...(params.plugins ?? [])]
    });
    const get = async (transport = SETTINGS_TRANSPORT) => {
        const [response] = await handler.invoke({ body: { query: GET, variables: { transport } } });
        return response.data.mailer.getTransportSettings;
    };
    const save = async (settings: Record<string, unknown>, transport = SETTINGS_TRANSPORT) => {
        const [response] = await handler.invoke({
            body: { query: SAVE, variables: { transport, settings } }
        });
        return response.data.mailer.saveTransportSettings;
    };
    return { handler, send, get, save };
};

describe("Transport settings, for a transport that is not SMTP", () => {
    it("saves and reads the settings without returning the secret", async () => {
        const { save, get } = setup();

        const saved = await save({ apiKey: "key-1", from: "a@acme.test" });
        expect(saved).toEqual({
            data: {
                transport: SETTINGS_TRANSPORT,
                settings: { from: "a@acme.test", region: "eu" },
                source: "storage"
            },
            error: null
        });

        expect(await get()).toEqual({
            data: {
                transport: SETTINGS_TRANSPORT,
                settings: { from: "a@acme.test", region: "eu" },
                source: "storage"
            },
            error: null
        });
    });

    it("gives the transport its decrypted secret, and keeps it when a save leaves it out", async () => {
        const { save, handler, send } = setup();

        await save({ apiKey: "key-1", from: "a@acme.test" });
        await save({ from: "b@acme.test" });
        const [response] = await handler.sendTestMail({ to: "admin@dummy-host.webiny" });

        expect(response.data.mailer.sendTestMail).toEqual({ data: true, error: null });
        expect(send).toHaveBeenCalledWith(
            expect.objectContaining({ apiKey: "key-1", from: "b@acme.test" }),
            expect.anything()
        );
    });

    it("requires the secret again when a field it is bound to changes", async () => {
        const { save, handler, send } = setup();

        await save({ apiKey: "key-1", from: "a@acme.test" });
        const result = await save({ from: "a@acme.test", region: "us" });

        expect(result.data).toBeNull();
        expect(result.error).toEqual({
            code: "Mailer/Settings/Validation",
            message: "Settings validation failed."
        });

        await handler.sendTestMail({ to: "admin@dummy-host.webiny" });
        expect(send).toHaveBeenCalledWith(
            expect.objectContaining({ apiKey: "key-1", region: "eu" }),
            expect.anything()
        );
    });

    it("validates the settings with the transport's schema", async () => {
        const { save } = setup();

        const result = await save({ apiKey: "key-1" });

        expect(result.error.code).toBe("Mailer/Settings/Validation");
    });

    it("refuses an unknown transport", async () => {
        const { get, save } = setup();

        expect((await get("Nope/Transport")).error.code).toBe("Mailer/Settings/UnknownTransport");
        expect((await save({ from: "a@acme.test" }, "Nope/Transport")).error.code).toBe(
            "Mailer/Settings/UnknownTransport"
        );
    });

    it("refuses reading and saving without the mailer.settings permission", async () => {
        const { get, save } = setup({ permissions: [] });

        expect((await get()).error.code).toBe("Mailer/Settings/NotAuthorized");
        expect((await save({ apiKey: "key-1", from: "a@acme.test" })).error.code).toBe(
            "Mailer/Settings/NotAuthorized"
        );
    });

    it("publishes the saved settings with the transport and without the secret", async () => {
        const handle = vi.fn(async () => {});
        class AfterSaveHandler implements MailerSettingsAfterSaveEventHandler.Interface {
            handle = handle;
        }
        const { save } = setup({
            plugins: [
                (container: any) =>
                    container.register(
                        MailerSettingsAfterSaveEventHandler.createImplementation({
                            implementation: AfterSaveHandler,
                            dependencies: []
                        })
                    )
            ]
        });

        await save({ apiKey: "key-1", from: "a@acme.test" });

        expect(handle).toHaveBeenCalledWith(
            expect.objectContaining({
                payload: {
                    transport: SETTINGS_TRANSPORT,
                    settings: { from: "a@acme.test", region: "eu" }
                }
            })
        );
    });
});
