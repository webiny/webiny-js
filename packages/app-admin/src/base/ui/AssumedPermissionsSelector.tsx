import React from "react";
import { createVoidComponent } from "@webiny/app";
import { makeDecoratable } from "@webiny/app";

/**
 * Placeholder for the "view as" header control. See AssumedPermissionsBanner for why the Layout renders
 * a placeholder rather than the component itself.
 *
 * Unlike the banner, this one renders nothing unless a preview is already active. Entering a
 * preview happens from the role and team forms. It exists so that someone comparing roles can jump
 * straight from one to the next instead of exiting and opening the next form each time.
 */
export const AssumedPermissionsSelector = makeDecoratable("AssumedPermissionsSelector", () => {
    return <AssumedPermissionsSelectorRenderer />;
});

export const AssumedPermissionsSelectorRenderer = makeDecoratable(
    "AssumedPermissionsSelectorRenderer",
    createVoidComponent()
);
