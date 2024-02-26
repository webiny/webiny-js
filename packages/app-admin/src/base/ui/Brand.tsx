import React from "react";
import { createVoidComponent, makeDecoratable } from "@webiny/app";

export const Brand = makeDecoratable("Brand", () => {
    return <BrandRenderer />;
});

export const BrandRenderer = makeDecoratable("BrandRenderer", createVoidComponent());
