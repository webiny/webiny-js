import React from "react";
import { makeComposable } from "@webiny/app-admin-core";

export const Brand = makeComposable("Brand", () => {
    return <BrandRenderer />;
});

export const BrandRenderer = makeComposable("BrandRenderer");
