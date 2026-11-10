import { AiSettingsLocation } from "@webiny/app-admin";
import { IdentityContext } from "@webiny/app-admin/features/security/IdentityContext/abstractions.js";
import { RouterGateway } from "@webiny/app/features/router/abstractions.js";
import { Routes } from "~/admin/routes.js";

/**
 * The AI Power-Ups settings screen, as the place the assistant sends someone to choose a model.
 *
 * The settings have no permission of their own, so changing them is for full access only.
 */
class AiPowerUpsSettingsLocationImpl implements AiSettingsLocation.Interface {
    constructor(
        private identityContext: IdentityContext.Interface,
        private router: RouterGateway.Interface
    ) {}

    canOpen(): boolean {
        const identity = this.identityContext.getIdentity();
        return Boolean(identity.getPermission("*", true));
    }

    open(): void {
        this.router.pushState(Routes.Settings.path);
    }
}

export const AiPowerUpsSettingsLocation = AiSettingsLocation.createImplementation({
    implementation: AiPowerUpsSettingsLocationImpl,
    dependencies: [IdentityContext, RouterGateway]
});
