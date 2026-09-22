import React from "react";
import { createVoidComponent, makeDecoratable } from "@webiny/app";

/**
 * Placeholder for the "view as" header control. See AssumedRoleBanner for why the Layout renders
 * a placeholder rather than the component itself.
 *
 * Unlike the banner, this one renders nothing unless a preview is already active — entering a
 * preview happens through the command palette. It exists so that someone comparing roles can jump
 * straight from one to the next instead of exiting and reopening the palette each time.
 */
export const AssumedRoleSelector = makeDecoratable("AssumedRoleSelector", () => {
    return <AssumedRoleSelectorRenderer />;
});

export const AssumedRoleSelectorRenderer = makeDecoratable(
    "AssumedRoleSelectorRenderer",
    createVoidComponent()
);
