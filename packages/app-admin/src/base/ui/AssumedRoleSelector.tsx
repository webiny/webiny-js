import React from "react";
import { createVoidComponent, makeDecoratable } from "@webiny/app";

/**
 * Placeholder for the "view as" header control, mirroring TenantSelector.
 *
 * The Layout renders this rather than the real component because the real one resolves
 * AssumedRolePresenter, and the feature that registers it is part of the Admin config tree, which
 * has not rendered yet the first time a Layout mounts. Rendering nothing until the decorator
 * arrives is the difference between an empty header slot and a thrown "No registration found".
 */
export const AssumedRoleSelector = makeDecoratable("AssumedRoleSelector", () => {
    return <AssumedRoleSelectorRenderer />;
});

export const AssumedRoleSelectorRenderer = makeDecoratable(
    "AssumedRoleSelectorRenderer",
    createVoidComponent()
);
