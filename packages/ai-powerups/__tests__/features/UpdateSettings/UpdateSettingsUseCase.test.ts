import { describe } from "vitest";
import { it } from "vitest";
import { expect } from "vitest";
import { Container } from "@webiny/di";
import { Result } from "@webiny/feature/api";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { EventPublisher } from "@webiny/api-core/features/eventPublisher/index.js";
import { UpdateSettingsUseCase } from "~/api/features/UpdateSettings/abstractions.js";
import { UpdateSettingsRepository } from "~/api/features/UpdateSettings/abstractions.js";
import { UpdateSettingsUseCaseImplementation } from "~/api/features/UpdateSettings/UpdateSettingsUseCase.js";
import { AiPowerUpsPermissionsFeature } from "~/api/features/AiPowerUpsPermissions/feature.js";
import type { IAiPowerUpsSettings } from "~/api/types.js";

type Permission = { name: string; [key: string]: unknown };

/*
 * Matches a requested name against granted ones the way IdentityContext does for these cases: an
 * exact name, `*`, or a `prefix.*` wildcard.
 */
function matches(granted: string, requested: string): boolean {
    if (granted === "*" || granted === requested) {
        return true;
    }
    if (!granted.endsWith(".*")) {
        return false;
    }
    const prefix = granted.slice(0, -1);
    return requested.startsWith(prefix);
}

const setup = (permissions: Permission[]) => {
    const container = new Container();
    const saved: IAiPowerUpsSettings[] = [];

    const find = (name: string) => permissions.filter(item => matches(item.name, name));

    container.registerInstance(IdentityContext, {
        getIdentity: () => ({ id: "u1" }),
        getPermission: async (name: string) => find(name)[0] ?? null,
        getPermissions: async (name: string) => find(name),
        hasFullAccess: async () => permissions.some(item => item.name === "*")
    } as never);
    container.registerInstance(EventPublisher, { publish: async () => undefined } as never);
    container.registerInstance(UpdateSettingsRepository, {
        execute: async (input: IAiPowerUpsSettings) => {
            saved.push(input);
            return Result.ok(input);
        }
    });

    AiPowerUpsPermissionsFeature.register(container);
    container.register(UpdateSettingsUseCaseImplementation);

    return { useCase: container.resolve(UpdateSettingsUseCase), saved };
};

const input = { connections: { presets: [] } } as unknown as IAiPowerUpsSettings;

describe("UpdateSettingsUseCase permissions", () => {
    it.each([
        ["full access", [{ name: "*" }]],
        ["AI Power-Ups full access", [{ name: "aiPowerUps.*" }]],
        ["the settings permission", [{ name: "aiPowerUps.settings" }]]
    ])("saves for a caller with %s", async (_label, permissions) => {
        const { useCase, saved } = setup(permissions);

        const result = await useCase.execute(input);

        expect(result.isOk()).toBe(true);
        expect(saved).toEqual([input]);
    });

    it("refuses a caller without the permission, and saves nothing", async () => {
        const { useCase, saved } = setup([{ name: "cms.contentEntry", rwd: "rwd" }]);

        const result = await useCase.execute(input);

        expect(result.isFail()).toBe(true);
        expect(result.error.code).toBe("AiPowerUps/Settings/NotAuthorized");
        expect(saved).toEqual([]);
    });
});
