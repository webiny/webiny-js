import { beforeEach, describe, expect, it } from "vitest";
import type { SecurityPermission } from "@webiny/api-core/types/security.js";
import { GetWorkflowSettingsUseCase } from "~/features/settings/GetWorkflowSettings/index.js";
import { createContextHandler } from "~tests/__helpers/handler.js";
import { FakeWorkflowSettings } from "~tests/__helpers/FakeWorkflowSettings.js";
import { captureLoggedErrors, loggedErrors } from "~tests/__helpers/CapturingLogger.js";

const EDITOR: SecurityPermission[] = [{ name: "workflows", editor: true }];

/** The raw text `FakeWorkflowSettings` fails with. */
const RAW = "Storage is not available.";

const GET_SETTINGS = /* GraphQL */ `
    query GetSettings {
        workflows {
            getSettings {
                data {
                    exclusions {
                        userId
                    }
                }
                error {
                    code
                    message
                    data
                }
            }
        }
    }
`;

interface SettingsError {
    code: string;
    message: string;
    data: unknown;
}

interface GetSettingsEnvelope {
    data: unknown;
    error: SettingsError | null;
}

interface GetSettingsRoot {
    getSettings: GetSettingsEnvelope;
}

interface GetSettingsData {
    workflows: GetSettingsRoot;
}

interface GetSettingsBody {
    data: GetSettingsData;
}

describe("workflows GraphQL storage failures", () => {
    beforeEach(() => {
        loggedErrors.length = 0;
    });

    it("returns the fixed message and logs the storage error on the server", async () => {
        const settings = new FakeWorkflowSettings();
        settings.failuresLeft = 1;
        const { createQuery } = await createContextHandler({
            permissions: EDITOR,
            setup: async container => {
                container.registerInstance(GetWorkflowSettingsUseCase, settings);
                captureLoggedErrors(container);
            }
        });

        const [body] = await createQuery<GetSettingsBody>(GET_SETTINGS)();
        const envelope = body.data.workflows.getSettings;

        expect(envelope.data).toBeNull();
        expect(envelope.error).toEqual({
            code: "Workflows/Settings/Persistence",
            message: "The workflow settings could not be read or saved.",
            data: { cause: {} }
        });
        expect(JSON.stringify(body)).not.toContain(RAW);
        // Pino serialises an Error with its message and stack only under the `err` key.
        const logged = loggedErrors.find(entry => entry.fields.err instanceof Error);
        const cause = logged?.fields.err as Error | undefined;
        expect(cause?.message).toBe(RAW);
        expect(cause?.stack).toContain(RAW);
    });
});
