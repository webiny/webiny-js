import React from "react";
import { createVoidComponent, makeDecoratable } from "@webiny/app";

/** Placeholder for the preview banner. See AssumedRoleSelector for why this indirection exists. */
export const AssumedRoleBanner = makeDecoratable("AssumedRoleBanner", () => {
    return <AssumedRoleBannerRenderer />;
});

export const AssumedRoleBannerRenderer = makeDecoratable(
    "AssumedRoleBannerRenderer",
    createVoidComponent()
);
