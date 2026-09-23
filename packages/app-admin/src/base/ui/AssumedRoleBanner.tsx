import React from "react";
import { createVoidComponent } from "@webiny/app";
import { makeDecoratable } from "@webiny/app";

/**
 * Placeholder for the preview banner, mirroring TenantSelector.
 *
 * The Layout renders this rather than the real component because the real one resolves
 * AssumedRolePresenter, and the decorator that supplies it lives in the Admin config tree, which
 * has not rendered yet the first time a Layout mounts. Rendering nothing until the decorator
 * arrives is the difference between an empty slot and a thrown "No registration found".
 */
export const AssumedRoleBanner = makeDecoratable("AssumedRoleBanner", () => {
    return <AssumedRoleBannerRenderer />;
});

export const AssumedRoleBannerRenderer = makeDecoratable(
    "AssumedRoleBannerRenderer",
    createVoidComponent()
);
