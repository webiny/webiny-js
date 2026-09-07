import { describe, expect, it, vi } from "vitest";
import { Container } from "@webiny/feature/api";
import {
    CliCommandFactory,
    GetProjectSdkService,
    UiService
} from "@webiny/cli-core/abstractions/index.js";
import resetPasswordCommand from "~/cli/ResetPasswordCommand.js";

/**
 * Covers the checks the command makes before it prompts for anything. Each of them exists to fail
 * with an explanation rather than let the operator type a password into a dead end.
 */

interface ExtensionStub {
    params: unknown;
}

const setup = (extensions: Record<string, ExtensionStub[]>) => {
    const container = new Container();

    const projectConfig = {
        extensionsByType: (type: string) => extensions[type] ?? []
    };

    container.registerInstance(GetProjectSdkService, {
        execute: async () => ({ getProjectConfig: async () => projectConfig })
    } as never);

    container.registerInstance(UiService, {
        raw: vi.fn(),
        text: vi.fn(),
        textBold: vi.fn(),
        emptyLine: vi.fn(),
        info: vi.fn(),
        success: vi.fn(),
        error: vi.fn(),
        warning: vi.fn(),
        debug: vi.fn()
    });

    container.register(resetPasswordCommand);

    return container.resolve(CliCommandFactory);
};

const authExtension = (params: Record<string, unknown>) => ({
    "Project/SelfHostedAuth": [{ params }]
});

describe("reset-password command", () => {
    it("takes the email as a required parameter and the API URL as an option", async () => {
        const definition = await setup({}).execute();

        expect(definition.name).toBe("reset-password");
        expect(definition.params).toEqual([
            expect.objectContaining({ name: "email", required: true })
        ]);
        expect(definition.options).toEqual([expect.objectContaining({ name: "api-url" })]);
    });

    it("explains itself when self-hosted auth is not configured at all", async () => {
        const definition = await setup({}).execute();

        await expect(definition.handler({ email: "admin@example.com" })).rejects.toThrow(
            /Self-hosted auth is not configured/
        );
    });

    it("refuses up front when the project turned the escape hatch off", async () => {
        const definition = await setup(
            authExtension({ signingSecret: "s3cret", cliPasswordReset: false })
        ).execute();

        await expect(definition.handler({ email: "admin@example.com" })).rejects.toThrow(
            /CLI password reset is disabled/
        );
    });

    it("points at the API URL config when there is nothing to call", async () => {
        const definition = await setup(authExtension({ signingSecret: "s3cret" })).execute();

        await expect(definition.handler({ email: "admin@example.com" })).rejects.toThrow(
            /No API URL configured/
        );
    });
});
